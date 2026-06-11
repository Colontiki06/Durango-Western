import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PagosService {
  private client: MercadoPagoConfig;

  constructor(private readonly prisma: PrismaService) {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

    if (!accessToken) {
      throw new Error('Falta MERCADO_PAGO_ACCESS_TOKEN en .env');
    }

    this.client = new MercadoPagoConfig({ accessToken });
  }

  async crearPreferencia(pedidoId: string) {
    const pedido = await this.prisma.pedidos.findUnique({
      where: { id: pedidoId },
      include: {
        pedido_items: true,
      },
    });

    if (!pedido) {
      throw new BadRequestException('Pedido no encontrado');
    }

    if (!pedido.pedido_items || pedido.pedido_items.length === 0) {
      throw new BadRequestException('El pedido no tiene productos');
    }

    const frontendUrl = this.obtenerFrontendUrl();
    const backendPublicUrl = this.obtenerBackendPublicUrl();

    const successUrl = `${frontendUrl}/pago-exitoso`;
    const failureUrl = `${frontendUrl}/pago-fallido`;
    const pendingUrl = `${frontendUrl}/pago-pendiente`;

    const body: any = {
      external_reference: pedido.id,

      metadata: {
        pedido_id: pedido.id,
      },

      items: [
        ...pedido.pedido_items.map((item) => ({
          id: String(item.id),
          title: String(item.nombre_producto || 'Producto Durango Western'),
          quantity: Number(item.cantidad),
          unit_price: Number(item.precio_unitario),
          currency_id: 'MXN',
        })),

        ...(Number(pedido.envio ?? 0) > 0
          ? [
              {
                id: 'envio',
                title: 'Costo de envío',
                quantity: 1,
                unit_price: Number(pedido.envio),
                currency_id: 'MXN',
              },
            ]
          : []),
      ],

      /**
       * Estas rutas son del FRONTEND.
       * Aquí Mercado Pago regresa al cliente después del pago.
       */
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl,
      },
    };

    /**
     * auto_return solo se activa con HTTPS.
     *
     * En local con localhost puede fallar con:
     * "auto_return invalid. back_url.success must be defined"
     *
     * En producción sí se activa porque FRONTEND_URL será:
     * https://durangowestern.com.mx
     */
    if (frontendUrl.startsWith('https://')) {
      body.auto_return = 'approved';
    }

    /**
     * Esta ruta es del BACKEND.
     * En local: ngrok.
     * En producción: https://api.durangowestern.com.mx
     */
    if (backendPublicUrl) {
      body.notification_url = `${backendPublicUrl}/api/pagos/mercado-pago/webhook`;
    }

    console.log('===== CREANDO PREFERENCIA MERCADO PAGO =====');
    console.log('FRONTEND_URL:', frontendUrl);
    console.log('BACKEND_PUBLIC_URL:', backendPublicUrl);
    console.log('SUCCESS_URL:', successUrl);
    console.log('FAILURE_URL:', failureUrl);
    console.log('PENDING_URL:', pendingUrl);
    console.log('AUTO_RETURN:', body.auto_return ?? 'desactivado');
    console.log('NOTIFICATION_URL:', body.notification_url);
    console.log('ITEMS:', JSON.stringify(body.items, null, 2));

    try {
      const preference = new Preference(this.client);
      const result = await preference.create({ body });

      return {
        preference_id: result.id,
        init_point: result.init_point,
        sandbox_init_point: result.sandbox_init_point,
      };
    } catch (error: any) {
      console.error('===== ERROR CREANDO PREFERENCIA MP =====');
      console.error('MESSAGE:', error?.message);
      console.error('CAUSE:', JSON.stringify(error?.cause, null, 2));
      console.error('STATUS:', error?.status);
      console.error('ERROR:', error);

      throw new InternalServerErrorException({
        message: 'No se pudo crear la preferencia de Mercado Pago',
        mercadoPagoError: error?.cause || error?.message || error,
      });
    }
  }

  private obtenerFrontendUrl(): string {
    const frontendUrl = process.env.FRONTEND_URL?.trim().replace(/\/$/, '');

    if (!frontendUrl) {
      throw new BadRequestException('Falta FRONTEND_URL en .env');
    }

    if (
      !frontendUrl.startsWith('http://') &&
      !frontendUrl.startsWith('https://')
    ) {
      throw new BadRequestException(
        'FRONTEND_URL debe iniciar con http:// o https://',
      );
    }

    return frontendUrl;
  }

  private obtenerBackendPublicUrl(): string {
    return process.env.BACKEND_PUBLIC_URL?.trim().replace(/\/$/, '') || '';
  }

  async procesarWebhook(body: any, query: any) {
    console.log('===== WEBHOOK MERCADO PAGO =====');
    console.log('BODY:', JSON.stringify(body, null, 2));
    console.log('QUERY:', JSON.stringify(query, null, 2));

    const tipo = body?.type || query?.type || body?.topic || query?.topic;

    if (tipo && tipo !== 'payment') {
      return {
        received: true,
        message: `Evento ignorado: ${tipo}`,
      };
    }

    const paymentId = body?.data?.id || query?.['data.id'] || query?.id;

    if (!paymentId) {
      return {
        received: true,
        message: 'Sin paymentId',
      };
    }

    let payment: any;

    try {
      const paymentClient = new Payment(this.client);
      payment = await paymentClient.get({ id: String(paymentId) });
    } catch (error) {
      console.error('No se pudo obtener el pago:', error);

      return {
        received: true,
        message: 'Pago todavía no disponible en Mercado Pago',
        paymentId,
      };
    }

    const pedidoId = payment.external_reference;

    if (!pedidoId) {
      return {
        received: true,
        message: 'Sin external_reference',
      };
    }

    const estadoPago = payment.status;

    return this.prisma.$transaction(async (tx) => {
      const pedido = await tx.pedidos.findUnique({
        where: { id: pedidoId },
        include: {
          pedido_items: true,
        },
      });

      if (!pedido) {
        return {
          received: true,
          message: 'Pedido no encontrado',
          pedidoId,
        };
      }

      const pagoExistente = await tx.pagos.findFirst({
        where: {
          referencia_pago: String(payment.id),
          proveedor: 'mercado_pago',
        },
      });

      if (pagoExistente) {
        return {
          received: true,
          message: 'Pago ya procesado',
          paymentId: payment.id,
          status: estadoPago,
          pedidoId,
        };
      }

      try {
        await tx.pagos.create({
          data: {
            pedido_id: pedido.id,
            proveedor: 'mercado_pago',
            referencia_pago: String(payment.id),
            monto: Number(payment.transaction_amount ?? pedido.total),
            estado: estadoPago,
            fecha_pago: estadoPago === 'approved' ? new Date() : null,
          },
        });
      } catch (error: any) {
        if (error.code === 'P2002') {
          return {
            received: true,
            message: 'Pago duplicado ignorado',
            paymentId: payment.id,
          };
        }

        throw error;
      }

      if (estadoPago === 'approved') {
        const pedidoActualizado = await tx.pedidos.updateMany({
          where: {
            id: pedido.id,
            estado: {
              not: 'pagado',
            },
          },
          data: {
            estado: 'pagado',
            updated_at: new Date(),
          },
        });

        if (pedidoActualizado.count === 0) {
          return {
            received: true,
            message: 'Pedido ya pagado. No se descuenta stock otra vez.',
            paymentId: payment.id,
            status: estadoPago,
            pedidoId,
          };
        }

        for (const item of pedido.pedido_items) {
          if (item.variante_id) {
            await tx.producto_variantes.update({
              where: {
                id: item.variante_id,
              },
              data: {
                stock: {
                  decrement: Number(item.cantidad),
                },
              },
            });
          }
        }
      }

      if (estadoPago === 'rejected') {
        await tx.pedidos.update({
          where: { id: pedido.id },
          data: {
            estado: 'pago_rechazado',
            updated_at: new Date(),
          },
        });
      }

      if (estadoPago === 'pending') {
        await tx.pedidos.update({
          where: { id: pedido.id },
          data: {
            estado: 'pago_pendiente',
            updated_at: new Date(),
          },
        });
      }

      return {
        received: true,
        paymentId: payment.id,
        status: estadoPago,
        pedidoId,
      };
    });
  }
}
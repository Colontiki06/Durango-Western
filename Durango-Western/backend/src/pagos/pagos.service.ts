import { Injectable, BadRequestException } from '@nestjs/common';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
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
      include: { pedido_items: true },
    });

    if (!pedido) throw new BadRequestException('Pedido no encontrado');

    const preference = new Preference(this.client);

    const result = await preference.create({
      body: {
        external_reference: pedido.id,
        notification_url: 'https://heaving-precision-saucy.ngrok-free.dev/api/pagos/mercado-pago/webhook',
        metadata: { pedido_id: pedido.id },
        items: [
  ...pedido.pedido_items.map((item) => ({
    id: item.id,
    title: item.nombre_producto,
    quantity: item.cantidad,
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
        back_urls: {
          success: 'https://heaving-precision-saucy.ngrok-free.dev/pago-exitoso',
          failure: 'https://heaving-precision-saucy.ngrok-free.dev/pago-fallido',
          pending: 'https://heaving-precision-saucy.ngrok-free.dev/pago-pendiente',
        },
      },
    });

    return {
      preference_id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
    };
  }

  async procesarWebhook(body: any, query: any) {
    console.log('===== WEBHOOK MP =====');
    console.log('BODY:', JSON.stringify(body, null, 2));
    console.log('QUERY:', JSON.stringify(query, null, 2));

    const tipo = body?.type || query?.type || body?.topic || query?.topic;

    if (tipo && tipo !== 'payment') {
      return { received: true, message: `Evento ignorado: ${tipo}` };
    }

    const paymentId = body?.data?.id || query?.['data.id'] || query?.id;

    if (!paymentId) {
      return { received: true, message: 'Sin paymentId' };
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
      return { received: true, message: 'Sin external_reference' };
    }

    const estadoPago = payment.status;

    return this.prisma.$transaction(async (tx) => {
      const pedido = await tx.pedidos.findUnique({
        where: { id: pedidoId },
        include: { pedido_items: true },
      });

      if (!pedido) {
        return { received: true, message: 'Pedido no encontrado', pedidoId };
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
      }catch (error: any) {
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
            decrement: item.cantidad,
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
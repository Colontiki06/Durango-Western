import { Injectable, BadRequestException } from '@nestjs/common';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PagosService {
  private client: MercadoPagoConfig;

  constructor(private readonly prisma: PrismaService) {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

    if (!accessToken) {
      throw new Error('Falta MERCADO_PAGO_ACCESS_TOKEN en .env');
    }

    this.client = new MercadoPagoConfig({
      accessToken,
    });
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

    const preference = new Preference(this.client);

    const result = await preference.create({
      body: {
        external_reference: pedido.id,
        items: pedido.pedido_items.map((item) => ({
          id: item.id,
          title: item.nombre_producto,
          quantity: item.cantidad,
          unit_price: Number(item.precio_unitario),
          currency_id: 'MXN',
        })),
       back_urls: {
            success: 'https://heaving-precision-saucy.ngrok-free.dev/pago-exitoso',
            failure: 'https://heaving-precision-saucy.ngrok-free.dev/pago-fallido',
            pending: 'https://heaving-precision-saucy.ngrok-free.dev/pago-pendiente',
        },
        auto_return: 'approved',
    },
    });

    return {
      preference_id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
    };
  }
}
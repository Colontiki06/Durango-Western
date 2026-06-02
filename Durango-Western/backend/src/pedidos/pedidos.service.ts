import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PedidosService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private generarFolio(numero: number): string {
    return `DW-${String(numero).padStart(6, '0')}`;
  }

  async create(data: any) {
    console.log('===== PEDIDO RECIBIDO =====');
    console.log(JSON.stringify(data, null, 2));

    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      throw new BadRequestException('El carrito está vacío');
    }

    for (const item of data.items) {
      const cantidad = Number(item.cantidad);

      if (!item.producto_id) {
        throw new BadRequestException('Producto inválido');
      }

      if (!item.variante_id) {
        throw new BadRequestException(`Selecciona una variante para ${item.nombre}`);
      }

      if (!cantidad || cantidad <= 0) {
        throw new BadRequestException(`Cantidad inválida para ${item.nombre}`);
      }

      const variante = await this.prisma.producto_variantes.findUnique({
        where: {
          id: item.variante_id,
        },
        include: {
          productos: true,
          tallas: true,
        },
      });

      if (!variante) {
        throw new BadRequestException(
          `La variante seleccionada para ${item.nombre} ya no existe`,
        );
      }

      if (!variante.activo) {
        throw new BadRequestException(
          `${item.nombre} ya no está disponible`,
        );
      }

      if (!variante.productos || !variante.productos.activo) {
        throw new BadRequestException(
          `${item.nombre} ya no está disponible`,
        );
      }

      if (variante.producto_id !== item.producto_id) {
        throw new BadRequestException(
          `La variante no corresponde al producto ${item.nombre}`,
        );
      }

      const stockDisponible = variante.stock ?? 0;

      if (stockDisponible < cantidad) {
        throw new BadRequestException(
          `Stock insuficiente para ${item.nombre}. Disponible: ${stockDisponible}`,
        );
      }
    }

    const totalPedidos = await this.prisma.pedidos.count();
    const folio = this.generarFolio(totalPedidos + 1);

    const subtotal = data.items.reduce(
      (total: number, item: any) =>
        total + Number(item.precio) * Number(item.cantidad),
      0,
    );

    let direccionCreada: any = null;

    if (data.tipoEntrega === 'domicilio' && data.direccion) {
      direccionCreada = await this.prisma.direcciones.create({
        data: {
          nombre_recibe: data.cliente?.nombre ?? 'Cliente invitado',
          telefono: data.cliente?.telefono ?? null,
          calle: data.direccion.calle,
          numero: data.direccion.numeroExterior,
          colonia: data.direccion.colonia,
          ciudad: data.direccion.ciudad,
          estado: data.direccion.estado,
          codigo_postal: data.direccion.codigoPostal,
          referencias: data.direccion.referencias ?? null,
        },
      });
    }

    const pedido = await this.prisma.pedidos.create({
      data: {
        folio,
        subtotal,
        envio: 0,
        total: subtotal,
        estado: 'pendiente',
        metodo_pago: 'mercado_pago',
        direccion_id: direccionCreada?.id ?? null,
        notas: data.tipoEntrega === 'tienda'
          ? `Recolección en tienda. Cliente: ${data.cliente?.nombre ?? ''}, Tel: ${data.cliente?.telefono ?? ''}, Correo: ${data.cliente?.correo ?? ''}`
          : `Cliente: ${data.cliente?.nombre ?? ''}, Tel: ${data.cliente?.telefono ?? ''}, Correo: ${data.cliente?.correo ?? ''}`,
      },
    });

    for (const item of data.items) {
      const cantidad = Number(item.cantidad);
      const precio = Number(item.precio);

      await this.prisma.pedido_items.create({
        data: {
          pedido_id: pedido.id,
          producto_id: item.producto_id,
          variante_id: item.variante_id,
          nombre_producto: item.nombre,
          sku: item.codigo ?? null,
          talla: item.talla ?? null,
          cantidad,
          precio_unitario: precio,
          subtotal: precio * cantidad,
        },
      });
    }

    return await this.findOne(pedido.id);
  }

  async findAll() {
    return this.prisma.pedidos.findMany({
      include: {
        pedido_items: true,
        direcciones: true,
        pagos: true,
        envios: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.pedidos.findUnique({
      where: {
        id,
      },
      include: {
        pedido_items: true,
        pagos: true,
        envios: true,
        direcciones: true,
      },
    });
  }
}
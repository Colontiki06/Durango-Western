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

    const envioCalculado = Number(data.envio ?? 0);
    const totalCalculado = subtotal + envioCalculado;
    const tarifaEnvio = data.tarifaEnvio ?? null;

    const pedido = await this.prisma.pedidos.create({
  data: {
    folio,
    subtotal,
    envio: envioCalculado,
    total: totalCalculado,
    estado: 'pendiente',
    metodo_pago: 'mercado_pago',
    tipo_entrega: data.tipoEntrega ?? 'domicilio',
    direccion_id: direccionCreada?.id ?? null,
    notas: data.tipoEntrega === 'tienda'
      ? `Recolección en tienda. Cliente: ${data.cliente?.nombre ?? ''}, Tel: ${data.cliente?.telefono ?? ''}, Correo: ${data.cliente?.correo ?? ''}`
      : `Cliente: ${data.cliente?.nombre ?? ''}, Tel: ${data.cliente?.telefono ?? ''}, Correo: ${data.cliente?.correo ?? ''}`,
  },
});

    if (data.tipoEntrega === 'domicilio' && tarifaEnvio) {
  let paqueteriaId: string | null = null;

  if (tarifaEnvio.paqueteria) {
    const paqueteria = await this.prisma.paqueterias.findFirst({
      where: {
        nombre: {
          equals: String(tarifaEnvio.paqueteria).trim(),
          mode: 'insensitive',
        },
        activa: true,
      },
    });

    if (paqueteria) {
      paqueteriaId = paqueteria.id;
    }
  }

  await this.prisma.envios.create({
    data: {
      pedido_id: pedido.id,
      paqueteria_id: paqueteriaId,
      estado: 'pendiente',
      servicio: tarifaEnvio.servicio ?? null,
      costo: Number(envioCalculado),
      dias_estimados: tarifaEnvio.dias ?? null,
      skydropx_rate_id: tarifaEnvio.id ?? null,
      skydropx_quotation_id: data.skydropxQuotationId ?? null,
    },
  });
}

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
        envios: {
  include: {
    paqueterias: true,
  },
},
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
      envios: {
        include: {
          paqueterias: true,
        },
      },
      direcciones: true,
    },
  });
}

async actualizarEstadoEnvio(id: string, estado_envio: string) {
  const estadosPermitidos = [
    'pendiente',
    'preparando',
    'empacado',
    'enviado',
    'listo_recoger',
    'entregado',
    'cancelado',
  ];

  if (!estadosPermitidos.includes(estado_envio)) {
    throw new BadRequestException('Estado de envío no válido');
  }

  const pedidoActual: any = await this.prisma.pedidos.findUnique({
    where: { id },
    include: {
      envios: true,
    },
  });

  if (!pedidoActual) {
    throw new BadRequestException('Pedido no encontrado');
  }

  const estadoActual = pedidoActual.estado_envio ?? 'pendiente';

  const esRecoleccionTienda =
    pedidoActual.tipo_entrega === 'tienda' ||
    String(pedidoActual.notas ?? '').toLowerCase().includes('recolección en tienda') ||
    String(pedidoActual.notas ?? '').toLowerCase().includes('recoleccion en tienda');

  if (esRecoleccionTienda) {
    const estadosTienda = [
      'pendiente',
      'preparando',
      'listo_recoger',
      'entregado',
      'cancelado',
    ];

    if (!estadosTienda.includes(estado_envio)) {
      throw new BadRequestException(
        'Este pedido es para recolección en tienda y no puede usar estados de envío a domicilio',
      );
    }
  }

  if (!esRecoleccionTienda && estado_envio === 'listo_recoger') {
    throw new BadRequestException(
      'El estado listo para recoger solo aplica para recolección en tienda',
    );
  }

  if (
    estadoActual === 'enviado' &&
    ['pendiente', 'preparando', 'empacado'].includes(estado_envio)
  ) {
    throw new BadRequestException(
      'No puedes regresar un pedido enviado a pendiente, preparando o empacado',
    );
  }

  if (estadoActual === 'entregado' && estado_envio !== 'entregado') {
    throw new BadRequestException(
      'No puedes cambiar el estado de un pedido que ya fue entregado',
    );
  }

  const envio = pedidoActual.envios?.[0];

  if (!esRecoleccionTienda && estado_envio === 'enviado') {
    if (!envio) {
      throw new BadRequestException('Este pedido no tiene envío registrado');
    }

    if (!envio.numero_guia || !envio.paqueteria_id) {
      throw new BadRequestException(
        'Debes guardar la paquetería y el número de guía antes de marcar como enviado',
      );
    }
  }

  if (envio) {
    if (estado_envio === 'enviado' && estadoActual !== 'enviado') {
      await this.prisma.envios.update({
        where: { id: envio.id },
        data: {
          estado: 'enviado',
          fecha_envio: new Date(),
          updated_at: new Date(),
        },
      });
    }

    if (estado_envio === 'entregado' && estadoActual !== 'entregado') {
      await this.prisma.envios.update({
        where: { id: envio.id },
        data: {
          estado: 'entregado',
          fecha_entrega: new Date(),
          updated_at: new Date(),
        },
      });
    }
  }

  return this.prisma.pedidos.update({
    where: { id },
    data: {
      estado_envio,
      updated_at: new Date(),
    },
    include: {
      pedido_items: true,
      direcciones: true,
      pagos: true,
      envios: {
        include: {
          paqueterias: true,
        },
      },
    },
  });
}


}
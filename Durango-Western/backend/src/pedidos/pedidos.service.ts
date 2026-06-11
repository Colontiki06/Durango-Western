import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CorreosService } from '../correos/correos.service';

@Injectable()
export class PedidosService {
  private readonly logger = new Logger(PedidosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly correosService: CorreosService,
  ) {}

  private generarFolio(numero: number): string {
    return `DW-${String(numero).padStart(6, '0')}`;
  }

  private async generarSiguienteFolio(): Promise<string> {
    const pedidos = await this.prisma.pedidos.findMany({
      where: {
        folio: {
          startsWith: 'DW-',
        },
      },
      select: {
        folio: true,
      },
    });

    const numeros = pedidos.map((pedido) => {
      const numero = Number(String(pedido.folio).replace('DW-', ''));
      return Number.isFinite(numero) ? numero : 0;
    });

    const maximo = numeros.length > 0 ? Math.max(...numeros) : 0;

    let siguiente = maximo + 1;
    let folio = this.generarFolio(siguiente);

    while (
      await this.prisma.pedidos.findUnique({
        where: { folio },
      })
    ) {
      siguiente++;
      folio = this.generarFolio(siguiente);
    }

    return folio;
  }

  private extraerCorreoDesdeNotas(notas?: string | null): string | null {
    const texto = String(notas ?? '');

    const match = texto.match(/Correo:\s*([^\s,]+)/i);

    if (!match?.[1]) {
      return null;
    }

    const correo = match[1].trim().toLowerCase();
    const esCorreoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);

    return esCorreoValido ? correo : null;
  }

  private extraerNombreDesdeNotas(notas?: string | null): string {
    const texto = String(notas ?? '');

    const match = texto.match(/Cliente:\s*([^,]+)/i);

    if (!match?.[1]) {
      return 'Cliente';
    }

    return match[1].trim() || 'Cliente';
  }

  private async obtenerDatosClienteParaCorreo(pedido: any): Promise<{
    nombre: string;
    correo: string | null;
  }> {
    const nombreDesdeNotas = this.extraerNombreDesdeNotas(pedido.notas);
    const correoDesdeNotas = this.extraerCorreoDesdeNotas(pedido.notas);

    if (!pedido.usuario_id) {
      return {
        nombre: nombreDesdeNotas,
        correo: correoDesdeNotas,
      };
    }

    try {
      const usuario = await (this.prisma as any).usuarios.findUnique({
        where: {
          id: pedido.usuario_id,
        },
      });

      return {
        nombre: usuario?.nombre || nombreDesdeNotas,
        correo: usuario?.correo || usuario?.email || correoDesdeNotas,
      };
    } catch (error) {
      this.logger.warn(
        `No se pudo obtener el usuario del pedido ${pedido.folio}. Se usará el correo guardado en notas.`,
      );

      return {
        nombre: nombreDesdeNotas,
        correo: correoDesdeNotas,
      };
    }
  }

  private async enviarConfirmacionPedidoCreado(data: {
    nombre: string;
    correo: string | null;
    folio: string;
    total: number;
  }) {
    if (!data.correo) {
      this.logger.warn(
        `No se envió correo de pedido creado porque el pedido ${data.folio} no tiene correo de cliente.`,
      );
      return;
    }

    try {
      const resultado = await this.correosService.enviarCorreoPedidoCreado({
        nombre: data.nombre,
        correo: data.correo,
        pedidoId: data.folio,
        total: data.total,
      });

      if (!resultado?.enviado) {
        this.logger.warn(
          `No se pudo enviar correo de pedido creado para ${data.folio}: ${JSON.stringify(
            resultado,
          )}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error enviando correo de pedido creado para ${data.folio}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private async enviarCorreoPedidoEnviadoSiAplica(data: {
    pedido: any;
    envio: any;
    estadoAnterior: string;
    estadoNuevo: string;
  }) {
    if (data.estadoAnterior === 'enviado' || data.estadoNuevo !== 'enviado') {
      return;
    }

    const numeroGuia = data.envio?.numero_guia;
    const paqueteria = data.envio?.paqueterias?.nombre;

    if (!numeroGuia || !paqueteria) {
      this.logger.warn(
        `No se envió correo de envío para ${data.pedido.folio} porque falta guía o paquetería.`,
      );
      return;
    }

    const cliente = await this.obtenerDatosClienteParaCorreo(data.pedido);

    if (!cliente.correo) {
      this.logger.warn(
        `No se envió correo de envío para ${data.pedido.folio} porque no se encontró correo del cliente.`,
      );
      return;
    }

    try {
      const resultado = await this.correosService.enviarCorreoPedidoEnviado({
        nombre: cliente.nombre,
        correo: cliente.correo,
        pedidoId: data.pedido.folio,
        paqueteria,
        numeroGuia,
      });

      if (!resultado?.enviado) {
        this.logger.warn(
          `No se pudo enviar correo de pedido enviado para ${data.pedido.folio}: ${JSON.stringify(
            resultado,
          )}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error enviando correo de pedido enviado para ${data.pedido.folio}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async create(data: any, usuarioId?: string | null) {
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
        throw new BadRequestException(
          `Selecciona una variante para ${item.nombre}`,
        );
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
        throw new BadRequestException(`${item.nombre} ya no está disponible`);
      }

      if (!variante.productos || !variante.productos.activo) {
        throw new BadRequestException(`${item.nombre} ya no está disponible`);
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

    const envioGratis = envioCalculado === 0;

    if (data.tipoEntrega === 'domicilio' && !envioGratis && !tarifaEnvio) {
      throw new BadRequestException(
        'Debes seleccionar una paquetería antes de finalizar la compra',
      );
    }

    let pedido: any = null;

    for (let intento = 1; intento <= 5; intento++) {
      const folioIntento = await this.generarSiguienteFolio();

      try {
        pedido = await this.prisma.pedidos.create({
          data: {
            folio: folioIntento,
            usuario_id: usuarioId ?? null,
            subtotal,
            envio: envioCalculado,
            total: totalCalculado,
            estado: 'pendiente',
            metodo_pago: 'mercado_pago',
            tipo_entrega: data.tipoEntrega ?? 'domicilio',
            direccion_id: direccionCreada?.id ?? null,
            notas:
              data.tipoEntrega === 'tienda'
                ? `Recolección en tienda. Cliente: ${data.cliente?.nombre ?? ''}, Tel: ${data.cliente?.telefono ?? ''}, Correo: ${data.cliente?.correo ?? ''}`
                : `Cliente: ${data.cliente?.nombre ?? ''}, Tel: ${data.cliente?.telefono ?? ''}, Correo: ${data.cliente?.correo ?? ''}`,
          },
        });

        break;
      } catch (error: any) {
        if (error?.code === 'P2002' && intento < 5) {
          continue;
        }

        throw error;
      }
    }

    if (!pedido) {
      throw new BadRequestException('No se pudo generar el pedido');
    }

    if (data.tipoEntrega === 'domicilio') {
      let paqueteriaId: string | null = null;

      if (tarifaEnvio?.paqueteria) {
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
          servicio: tarifaEnvio?.servicio ?? null,
          costo: Number(envioCalculado),
          dias_estimados: tarifaEnvio?.dias ?? null,
          skydropx_rate_id: tarifaEnvio?.id ?? null,
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

    await this.enviarConfirmacionPedidoCreado({
      nombre: data.cliente?.nombre ?? 'Cliente',
      correo: data.cliente?.correo ?? null,
      folio: pedido.folio,
      total: totalCalculado,
    });

    return await this.findOne(pedido.id);
  }

  async actualizarGuia(
    id: string,
    data: {
      numero_guia?: string;
      paqueteria_id?: string;
      paqueteria_nombre?: string;
      servicio?: string;
    },
  ) {
    const numeroGuia = String(data.numero_guia ?? '').trim();

    if (!numeroGuia) {
      throw new BadRequestException('El número de guía es obligatorio');
    }

    const pedido = await this.prisma.pedidos.findUnique({
      where: { id },
      include: {
        envios: true,
      },
    });

    if (!pedido) {
      throw new BadRequestException('Pedido no encontrado');
    }

    let paqueteriaId = data.paqueteria_id ?? null;

    if (!paqueteriaId && data.paqueteria_nombre) {
      const paqueteria = await this.prisma.paqueterias.findFirst({
        where: {
          nombre: {
            equals: String(data.paqueteria_nombre).trim(),
            mode: 'insensitive',
          },
          activa: true,
        },
      });

      if (!paqueteria) {
        throw new BadRequestException('La paquetería seleccionada no existe');
      }

      paqueteriaId = paqueteria.id;
    }

    if (!paqueteriaId) {
      throw new BadRequestException('Debes seleccionar una paquetería');
    }

    const envioActual = pedido.envios?.[0];

    if (envioActual) {
      await this.prisma.envios.update({
        where: {
          id: envioActual.id,
        },
        data: {
          numero_guia: numeroGuia,
          paqueteria_id: paqueteriaId,
          servicio: data.servicio ?? envioActual.servicio,
          updated_at: new Date(),
        },
      });
    } else {
      await this.prisma.envios.create({
        data: {
          pedido_id: pedido.id,
          paqueteria_id: paqueteriaId,
          numero_guia: numeroGuia,
          estado: 'pendiente',
          servicio: data.servicio ?? null,
          costo: Number(pedido.envio ?? 0),
        },
      });
    }

    return this.findOne(id);
  }

  async findMisPedidos(usuarioId: string) {
    if (!usuarioId) {
      throw new BadRequestException('Usuario no válido');
    }

    return this.prisma.pedidos.findMany({
      where: {
        usuario_id: usuarioId,
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
      orderBy: {
        created_at: 'desc',
      },
    });
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
        envios: {
          include: {
            paqueterias: true,
          },
        },
      },
    });

    if (!pedidoActual) {
      throw new BadRequestException('Pedido no encontrado');
    }

    const estadoActual = pedidoActual.estado_envio ?? 'pendiente';

    const esRecoleccionTienda =
      pedidoActual.tipo_entrega === 'tienda' ||
      String(pedidoActual.notas ?? '')
        .toLowerCase()
        .includes('recolección en tienda') ||
      String(pedidoActual.notas ?? '')
        .toLowerCase()
        .includes('recoleccion en tienda');

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

    const pedidoActualizado = await this.prisma.pedidos.update({
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

    const envioActualizado = pedidoActualizado.envios?.[0];

    await this.enviarCorreoPedidoEnviadoSiAplica({
      pedido: pedidoActualizado,
      envio: envioActualizado,
      estadoAnterior: estadoActual,
      estadoNuevo: estado_envio,
    });

    return pedidoActualizado;
  }
}
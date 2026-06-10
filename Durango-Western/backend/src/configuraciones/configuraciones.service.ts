import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConfiguracionesService {

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private configuracion() {
    return (this.prisma as any).configuracion_tienda;
  }

  async obtenerConfiguracion() {

    let config =
      await this.configuracion().findFirst();

    if (!config) {

      config = await this.configuracion().create({
        data: {},
      });

    }

    return config;
  }

  async guardarConfiguracion(data: any) {

    let config =
      await this.configuracion().findFirst();

    if (!config) {

      config = await this.configuracion().create({
        data: {},
      });

    }

    return this.configuracion().update({
      where: {
        id: config.id,
      },
      data: {
        nombre_tienda: data.nombreTienda,
        correo_contacto: data.correo,
        telefono: data.telefono,
        direccion: data.direccion,
        envio_gratis_desde: data.envioGratisDesde,
        estado_tienda: data.estadoTienda,
        compras_invitado: data.comprasInvitado,
        mostrar_productos_agotados: data.mostrarAgotados,
        carrito_persistente: data.carritoPersistente,
        updated_at: new Date(),
      },
    });
  }

}
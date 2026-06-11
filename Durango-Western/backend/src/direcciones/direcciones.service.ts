import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateDireccionDto } from './dto/create-direccion.dto';
import { UpdateDireccionDto } from './dto/update-direccion.dto';

@Injectable()
export class DireccionesService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerMisDirecciones(usuarioId: string) {
    return this.prisma.direcciones.findMany({
      where: {
        usuario_id: usuarioId,
      },
      orderBy: [
        {
          principal: 'desc',
        },
        {
          created_at: 'desc',
        },
      ],
    });
  }

  async crearDireccion(usuarioId: string, dto: CreateDireccionDto) {
    const esPrincipal = dto.principal === true;

    return this.prisma.$transaction(async (tx) => {
      if (esPrincipal) {
        await tx.direcciones.updateMany({
          where: {
            usuario_id: usuarioId,
          },
          data: {
            principal: false,
            updated_at: new Date(),
          },
        });
      }

      const totalDirecciones = await tx.direcciones.count({
        where: {
          usuario_id: usuarioId,
        },
      });

      const direccion = await tx.direcciones.create({
        data: {
          usuario_id: usuarioId,
          nombre_recibe: dto.nombre_recibe.trim(),
          telefono: dto.telefono?.trim() || null,
          calle: dto.calle.trim(),
          numero: dto.numero?.trim() || null,
          colonia: dto.colonia?.trim() || null,
          ciudad: dto.ciudad.trim(),
          estado: dto.estado.trim(),
          codigo_postal: dto.codigo_postal.trim(),
          referencias: dto.referencias?.trim() || null,
          principal: esPrincipal || totalDirecciones === 0,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      return direccion;
    });
  }

  async actualizarDireccion(
    usuarioId: string,
    direccionId: string,
    dto: UpdateDireccionDto,
  ) {
    const direccionExistente = await this.prisma.direcciones.findUnique({
      where: {
        id: direccionId,
      },
    });

    if (!direccionExistente) {
      throw new NotFoundException('Dirección no encontrada.');
    }

    if (direccionExistente.usuario_id !== usuarioId) {
      throw new ForbiddenException('No puedes modificar esta dirección.');
    }

    const esPrincipal = dto.principal === true;

    return this.prisma.$transaction(async (tx) => {
      if (esPrincipal) {
        await tx.direcciones.updateMany({
          where: {
            usuario_id: usuarioId,
            id: {
              not: direccionId,
            },
          },
          data: {
            principal: false,
            updated_at: new Date(),
          },
        });
      }

      const direccionActualizada = await tx.direcciones.update({
        where: {
          id: direccionId,
        },
        data: {
          nombre_recibe:
            dto.nombre_recibe !== undefined
              ? dto.nombre_recibe.trim()
              : direccionExistente.nombre_recibe,

          telefono:
            dto.telefono !== undefined
              ? dto.telefono?.trim() || null
              : direccionExistente.telefono,

          calle:
            dto.calle !== undefined
              ? dto.calle.trim()
              : direccionExistente.calle,

          numero:
            dto.numero !== undefined
              ? dto.numero?.trim() || null
              : direccionExistente.numero,

          colonia:
            dto.colonia !== undefined
              ? dto.colonia?.trim() || null
              : direccionExistente.colonia,

          ciudad:
            dto.ciudad !== undefined
              ? dto.ciudad.trim()
              : direccionExistente.ciudad,

          estado:
            dto.estado !== undefined
              ? dto.estado.trim()
              : direccionExistente.estado,

          codigo_postal:
            dto.codigo_postal !== undefined
              ? dto.codigo_postal.trim()
              : direccionExistente.codigo_postal,

          referencias:
            dto.referencias !== undefined
              ? dto.referencias?.trim() || null
              : direccionExistente.referencias,

          principal:
            dto.principal !== undefined
              ? dto.principal
              : direccionExistente.principal,

          updated_at: new Date(),
        },
      });

      return direccionActualizada;
    });
  }

  async eliminarDireccion(usuarioId: string, direccionId: string) {
    const direccionExistente = await this.prisma.direcciones.findUnique({
      where: {
        id: direccionId,
      },
    });

    if (!direccionExistente) {
      throw new NotFoundException('Dirección no encontrada.');
    }

    if (direccionExistente.usuario_id !== usuarioId) {
      throw new ForbiddenException('No puedes eliminar esta dirección.');
    }

    await this.prisma.direcciones.delete({
      where: {
        id: direccionId,
      },
    });

    return {
      message: 'Dirección eliminada correctamente.',
    };
  }
}
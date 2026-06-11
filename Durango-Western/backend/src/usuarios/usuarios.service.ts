import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerMiPerfil(usuarioId: string) {
    const perfil = await this.prisma.profiles.findUnique({
      where: {
        id: usuarioId,
      },
    });

    if (!perfil) {
      throw new NotFoundException('Perfil no encontrado.');
    }

    return {
      id: perfil.id,
      nombre: perfil.nombre,
      email: perfil.correo,
      telefono: perfil.telefono,
      rol: perfil.rol,
      avatar_url: perfil.avatar_url,
    };
  }

  async actualizarMiPerfil(
    usuarioId: string,
    data: {
      nombre?: string;
      telefono?: string | null;
    },
  ) {
    const perfilExistente = await this.prisma.profiles.findUnique({
      where: {
        id: usuarioId,
      },
    });

    if (!perfilExistente) {
      throw new NotFoundException('Perfil no encontrado.');
    }

    const perfilActualizado = await this.prisma.profiles.update({
      where: {
        id: usuarioId,
      },
      data: {
        nombre: data.nombre?.trim() || perfilExistente.nombre,
        telefono:
          data.telefono === undefined
            ? perfilExistente.telefono
            : data.telefono?.trim() || null,
        updated_at: new Date(),
      },
    });

    return {
      id: perfilActualizado.id,
      nombre: perfilActualizado.nombre,
      email: perfilActualizado.correo,
      telefono: perfilActualizado.telefono,
      rol: perfilActualizado.rol,
      avatar_url: perfilActualizado.avatar_url,
    };
  }
}
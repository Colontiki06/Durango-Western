import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class PersonalizarInicioService {
  constructor(
  private readonly prisma: PrismaService,
  private readonly storageService: StorageService,
) {}

  private categoriasHome() {
    return (this.prisma as any).categorias_home;
  }

  async obtenerTodo() {
    const [banners, categorias] = await Promise.all([
      this.obtenerBanners(),
      this.obtenerCategorias(),
    ]);

    return {
      banners,
      categorias,
    };
  }

  async obtenerBanners() {
    return this.prisma.banners.findMany({
      orderBy: [
        { orden: 'asc' },
        { created_at: 'asc' },
      ],
    });
  }

  async crearBanner(data: any) {
    if (!data.titulo || !String(data.titulo).trim()) {
      throw new BadRequestException('El título del banner es obligatorio');
    }

    if (!data.imagen_url && !data.imagen) {
      throw new BadRequestException('La imagen del banner es obligatoria');
    }

    const total = await this.prisma.banners.count();

    return this.prisma.banners.create({
      data: {
        texto_superior: data.texto_superior ?? data.textoSuperior ?? null,
        titulo: String(data.titulo).trim(),
        descripcion: data.descripcion ?? null,
        imagen_url: data.imagen_url ?? data.imagen,
        texto_boton: data.texto_boton ?? data.textoBoton ?? 'Ver colección',
        enlace_boton: data.enlace_boton ?? data.enlaceBoton ?? '/productos',
        activo: data.activo ?? true,
        orden: data.orden ?? total + 1,
      },
    });
  }

  async actualizarBanner(id: string, data: any) {
    return this.prisma.banners.update({
      where: { id },
      data: {
        texto_superior: data.texto_superior ?? data.textoSuperior ?? null,
        titulo: data.titulo,
        descripcion: data.descripcion ?? null,
        imagen_url: data.imagen_url ?? data.imagen,
        texto_boton: data.texto_boton ?? data.textoBoton ?? 'Ver colección',
        enlace_boton: data.enlace_boton ?? data.enlaceBoton ?? '/productos',
        activo: data.activo ?? true,
        orden: data.orden ?? 0,
        updated_at: new Date(),
      },
    });
  }

  async eliminarBanner(id: string) {
    await this.prisma.banners.delete({
      where: { id },
    });

    return {
      message: 'Banner eliminado correctamente',
    };
  }

  async obtenerCategorias() {
    return this.categoriasHome().findMany({
      orderBy: [
        { orden: 'asc' },
        { created_at: 'asc' },
      ],
    });
  }

  async crearCategoria(data: any) {
    if (!data.nombre || !String(data.nombre).trim()) {
      throw new BadRequestException('El nombre de la categoría es obligatorio');
    }

    if (!data.imagen_url && !data.imagen) {
      throw new BadRequestException('La imagen de la categoría es obligatoria');
    }

    const total = await this.categoriasHome().count();

    return this.categoriasHome().create({
      data: {
        nombre: String(data.nombre).trim(),
        imagen_url: data.imagen_url ?? data.imagen,
        activa: data.activa ?? data.activo ?? true,
        orden: data.orden ?? total + 1,
      },
    });
  }

  async actualizarCategoria(id: string, data: any) {
    return this.categoriasHome().update({
      where: { id },
      data: {
        nombre: data.nombre,
        imagen_url: data.imagen_url ?? data.imagen,
        activa: data.activa ?? data.activo ?? true,
        orden: data.orden ?? 0,
        updated_at: new Date(),
      },
    });
  }

  async eliminarCategoria(id: string) {
    await this.categoriasHome().delete({
      where: { id },
    });

    return {
      message: 'Categoría eliminada correctamente',
    };
  }

  async subirImagen(file: any) {
  if (!file) {
    throw new BadRequestException('La imagen es obligatoria');
  }

  const uploaded = await this.storageService.uploadProductImage(file);

  return {
    url: uploaded.url,
  };
}

}
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

  const banner = await this.prisma.banners.create({
    data: {
      texto_superior: data.texto_superior ?? data.textoSuperior ?? null,
      titulo: String(data.titulo).trim(),
      descripcion: data.descripcion ?? null,
      imagen_url: data.imagen_url ?? data.imagen,
      texto_boton: data.texto_boton ?? data.textoBoton ?? 'Ver colección',
      enlace_boton: data.enlace_boton ?? data.enlaceBoton ?? '/productos',
      activo: data.activo ?? true,
      orden: Number(data.orden ?? total + 1),
    },
  });

  await this.normalizarOrden(
    'banners',
    banner.id,
    Number(banner.orden ?? total + 1),
  );

  return banner;
}

  async actualizarBanner(id: string, data: any) {
  const banner = await this.prisma.banners.update({
    where: { id },
    data: {
      texto_superior: data.texto_superior ?? data.textoSuperior ?? null,
      titulo: data.titulo,
      descripcion: data.descripcion ?? null,
      imagen_url: data.imagen_url ?? data.imagen,
      texto_boton: data.texto_boton ?? data.textoBoton ?? 'Ver colección',
      enlace_boton: data.enlace_boton ?? data.enlaceBoton ?? '/productos',
      activo: data.activo ?? true,
      orden: Number(data.orden ?? 1),
      updated_at: new Date(),
    },
  });

  await this.normalizarOrden('banners', id, Number(data.orden ?? 1));

  return banner;
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
  if (!data.categoria_id) {
    throw new BadRequestException('Selecciona una categoría del catálogo');
  }

  if (!data.nombre || !String(data.nombre).trim()) {
    throw new BadRequestException('El nombre de la categoría es obligatorio');
  }

  if (!data.imagen_url && !data.imagen) {
    throw new BadRequestException('La imagen de la categoría es obligatoria');
  }

  const total = await this.categoriasHome().count();

  const categoria = await this.categoriasHome().create({
    data: {
      categoria_id: data.categoria_id,
      nombre: String(data.nombre).trim(),
      slug: data.slug ?? null,
      enlace: data.enlace ?? `/productos/${data.slug}`,
      imagen_url: data.imagen_url ?? data.imagen,
      activa: data.activa ?? data.activo ?? true,
      orden: Number(data.orden ?? total + 1),
    },
  });

  await this.normalizarOrden(
    'categorias',
    categoria.id,
    Number(categoria.orden ?? total + 1),
  );

  return categoria;
}

  async actualizarCategoria(id: string, data: any) {
  const categoria = await this.categoriasHome().update({
    where: { id },
    data: {
      categoria_id: data.categoria_id ?? null,
      nombre: data.nombre,
      slug: data.slug ?? null,
      enlace: data.enlace ?? `/productos/${data.slug}`,
      imagen_url: data.imagen_url ?? data.imagen,
      activa: data.activa ?? data.activo ?? true,
      orden: Number(data.orden ?? 1),
      updated_at: new Date(),
    },
  });

  await this.normalizarOrden('categorias', id, Number(data.orden ?? 1));

  return categoria;
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

  private async normalizarOrden(
  tipo: 'banners' | 'categorias',
  idEditado: string,
  ordenDeseado: number,
) {
  const modelo =
    tipo === 'banners'
      ? this.prisma.banners
      : this.categoriasHome();

  const items = await modelo.findMany({
    orderBy: [
      { orden: 'asc' },
      { created_at: 'asc' },
    ],
  });

  const itemEditado = items.find((item: any) => item.id === idEditado);

  if (!itemEditado) return;

  const restantes = items.filter((item: any) => item.id !== idEditado);

  const posicion = Math.max(
    0,
    Math.min(Number(ordenDeseado || 1) - 1, restantes.length),
  );

  restantes.splice(posicion, 0, itemEditado);

  for (let i = 0; i < restantes.length; i++) {
    await modelo.update({
      where: { id: restantes[i].id },
      data: {
        orden: i + 1,
        updated_at: new Date(),
      },
    });
  }
}


}
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class ProductosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

 async findAll() {
  return this.prisma.productos.findMany({
    where: {
      activo: true,
    },
    include: {
      producto_imagenes: true,
      categorias: true,
      producto_variantes: {
        include: {
          tallas: true,
          colores: true,
        },
      },
    },
    orderBy: {
      created_at: 'desc',
    },
  });
}

  async findBySlug(slug: string) {
    return this.prisma.productos.findUnique({
      where: {
        slug,
      },
      include: {
        producto_imagenes: true,
        categorias: true,
        producto_variantes: {
          include: {
            tallas: true,
            colores: true,
          },
        },
      },
    });
  }

 async findOne(id: string) {
  return this.prisma.productos.findUnique({
    where: { id },
    include: {
      producto_imagenes: true,
      categorias: true,
      producto_variantes: {
        include: {
          tallas: true,
          colores: true,
        },
      },
    },
  });
}

  async uploadImage(id: string, file: any) {
  const uploaded = await this.storageService.uploadProductImage(file);

  const totalImagenes = await this.prisma.producto_imagenes.count({
    where: {
      producto_id: id,
    },
  });

  const image = await this.prisma.producto_imagenes.create({
    data: {
      producto_id: id,
      imagen_url: uploaded.url,
      principal: totalImagenes === 0,
      orden: totalImagenes + 1,
    },
  });

  return {
    message: 'Imagen subida correctamente',
    image,
  };
}

  async findRelacionados(id: string) {
  const producto = await this.prisma.productos.findUnique({
    where: { id },
    select: {
      id: true,
      categoria_id: true,
    },
  });

  if (!producto || !producto.categoria_id) {
    return [];
  }

  return this.prisma.productos.findMany({
    where: {
      categoria_id: producto.categoria_id,
      id: {
        not: producto.id,
      },
      activo: true,
    },
    include: {
      producto_imagenes: true,
    },
    take: 4,
    orderBy: {
      created_at: 'desc',
    },
  });
}

async update(id: string, data: any) {
  const productoActualizado = await this.prisma.productos.update({
    where: { id },
    data: {
  nombre: data.nombre,
  codigo: data.codigo,
  descripcion: data.descripcion,
  precio: String(data.precio),
  costo: String(data.costo ?? 0),
  categoria_id: data.categoria_id,
  activo: data.estado === 'Activo',
  updated_at: new Date(),
},
  });

  if (Array.isArray(data.variantes)) {
    for (const variante of data.variantes) {
      await this.prisma.producto_variantes.update({
        where: { id: variante.id },
        data: {
          stock: Number(variante.stock),
        },
      });
    }
  }

  return this.prisma.productos.findUnique({
    where: { id },
    include: {
      producto_imagenes: true,
      categorias: true,
      producto_variantes: {
        include: {
          tallas: true,
          colores: true,
        },
      },
    },
  });
}

async updateStockVariante(varianteId: string, stock: number) {
  return this.prisma.producto_variantes.update({
    where: { id: varianteId },
    data: {
      stock: Number(stock),
    },
  });
}

async createVariante(productoId: string, data: any) {
  const producto = await this.prisma.productos.findUnique({
    where: { id: productoId },
    select: {
      codigo: true,
    },
  });

  const talla = await this.prisma.tallas.findUnique({
    where: {
      id: data.talla_id,
    },
  });

  if (!producto || !talla) {
    throw new Error('Producto o talla no encontrados');
  }

  const variante = await this.prisma.producto_variantes.create({
    data: {
      producto_id: productoId,
      talla_id: data.talla_id,
      color_id: data.color_id ?? null,
      sku: `${producto.codigo}-${talla.nombre}`,
      stock: Number(data.stock ?? 0),
      precio_extra: String(data.precio_extra ?? 0),
      activo: true,
    },
  });

  return variante;
}

async ocultar(id: string) {
  return this.prisma.productos.update({
    where: { id },
    data: {
      activo: false,
      updated_at: new Date(),
    },
  });
}

async setImagenPrincipal(imagenId: string) {
  const imagen = await this.prisma.producto_imagenes.findUnique({
    where: { id: imagenId },
  });

  if (!imagen) {
    throw new Error('Imagen no encontrada');
  }

  await this.prisma.producto_imagenes.updateMany({
    where: {
      producto_id: imagen.producto_id,
    },
    data: {
      principal: false,
    },
  });

  return this.prisma.producto_imagenes.update({
    where: { id: imagenId },
    data: {
      principal: true,
    },
  });
}

async deleteImagen(imagenId: string) {
  const imagen = await this.prisma.producto_imagenes.findUnique({
    where: { id: imagenId },
  });

  if (!imagen) {
    throw new Error('Imagen no encontrada');
  }

  await this.prisma.producto_imagenes.delete({
    where: { id: imagenId },
  });

  const imagenPrincipal = await this.prisma.producto_imagenes.findFirst({
    where: {
      producto_id: imagen.producto_id,
      principal: true,
    },
  });

  if (!imagenPrincipal) {
    const primeraImagen = await this.prisma.producto_imagenes.findFirst({
      where: {
        producto_id: imagen.producto_id,
      },
      orderBy: {
        orden: 'asc',
      },
    });

    if (primeraImagen) {
      await this.prisma.producto_imagenes.update({
        where: { id: primeraImagen.id },
        data: { principal: true },
      });
    }
  }

  return {
    message: 'Imagen eliminada correctamente',
  };
}

async updateOrdenImagen(imagenId: string, orden: number) {
  return this.prisma.producto_imagenes.update({
    where: { id: imagenId },
    data: {
      orden,
    },
  });
}

}
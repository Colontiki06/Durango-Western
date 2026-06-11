import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class ProductosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  private generarSlug(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  private detectarTipoProducto(nombre: string): string {
    const texto = nombre.toLowerCase();

    if (texto.includes('bota')) return 'BOTA';
    if (texto.includes('sombrero') || texto.includes('tejana')) return 'SOMB';
    if (texto.includes('camisa')) return 'CAM';
    if (texto.includes('pantalon') || texto.includes('pantalón') || texto.includes('tejano')) return 'PANT';
    if (texto.includes('cinto') || texto.includes('cinturon') || texto.includes('cinturón')) return 'CINTO';
    if (texto.includes('bolso') || texto.includes('mochila')) return 'BOLSO';

    return 'PROD';
  }

  private detectarSlugTipoProducto(nombre: string): string | null {
    const texto = nombre.toLowerCase();

    if (texto.includes('bota')) return 'botas';
    if (texto.includes('sombrero') || texto.includes('tejana')) return 'sombreros';
    if (texto.includes('camisa')) return 'camisas';
    if (texto.includes('pantalon') || texto.includes('pantalón') || texto.includes('tejano')) return 'pantalones';
    if (texto.includes('cinto') || texto.includes('cinturon') || texto.includes('cinturón')) return 'cintos';
    if (texto.includes('bolso') || texto.includes('mochila')) return 'bolsos';

    return null;
  }

  private async obtenerTipoProductoId(nombre: string): Promise<string | null> {
    const slug = this.detectarSlugTipoProducto(nombre);

    if (!slug) return null;

    const tipoProducto = await this.prisma.tipos_producto.findUnique({
      where: { slug },
    });

    return tipoProducto?.id ?? null;
  }

  private prefijoCategoria(slug: string): string {
    if (slug === 'caballero') return 'CAB';
    if (slug === 'dama') return 'DAM';
    if (slug === 'ninos' || slug === 'niños') return 'NIN';

    return 'GEN';
  }

  async generarCodigoProducto(nombre: string, categoriaId: string): Promise<string> {
    const categoria = await this.prisma.categorias.findUnique({
      where: { id: categoriaId },
    });

    const prefijo = this.prefijoCategoria(categoria?.slug ?? '');
    const tipo = this.detectarTipoProducto(nombre);

    const total = await this.prisma.productos.count();
    const consecutivo = String(total + 1).padStart(4, '0');

    return `DW-${prefijo}-${tipo}-${consecutivo}`;
  }

  async findAll(filtros: any = {}) {
  const esAdmin = filtros?.admin === true || filtros?.admin === 'true';

const where: any = {};

if (!esAdmin) {
  where.activo = true;
}

  const config = await (this.prisma as any).configuracion_tienda.findFirst();

  const mostrarAgotados =
    config?.mostrar_productos_agotados ?? false;

  const esCatalogoPublico =
    filtros.publico === true ||
    filtros.publico === 'true';

  if (esCatalogoPublico && !mostrarAgotados) {
    where.producto_variantes = {
      some: {
        activo: true,
        stock: {
          gt: 0,
        },
      },
    };
  }

  if (filtros.genero) {
    where.categorias = {
      is: {
        slug: filtros.genero,
      },
    };
  }

  if (filtros.tipo) {
    where.tipos_producto = {
      is: {
        slug: filtros.tipo,
      },
    };
  }

  if (filtros.categoria && filtros.categoria !== 'todos') {
    const tiposProducto = [
      'botas',
      'sombreros',
      'camisas',
      'pantalones',
      'cintos',
      'bolsos',
    ];

    const categorias = [
      'caballero',
      'dama',
      'ninos',
      'niños',
      'accesorios',
    ];

    if (tiposProducto.includes(filtros.categoria)) {
      where.tipos_producto = {
        is: {
          slug: filtros.categoria,
        },
      };
    }

    if (categorias.includes(filtros.categoria)) {
      where.categorias = {
        is: {
          slug: filtros.categoria,
        },
      };
    }
  }

  if (filtros.talla) {
    where.producto_variantes = {
      some: {
        activo: true,
        stock: {
          gt: 0,
        },
        tallas: {
          is: {
            nombre: filtros.talla,
          },
        },
      },
    };
  }

  if (
    filtros.precioMin !== undefined &&
    filtros.precioMin !== ''
  ) {
    where.precio = {
      ...where.precio,
      gte: String(filtros.precioMin),
    };
  }

  if (
    filtros.precioMax !== undefined &&
    filtros.precioMax !== ''
  ) {
    where.precio = {
      ...where.precio,
      lte: String(filtros.precioMax),
    };
  }

  if (filtros.destacado) {
    where.destacado = true;
  }

  if (filtros.buscar) {
  const palabras = String(filtros.buscar)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  where.AND = [
    ...(where.AND ?? []),
    ...palabras.map((palabra) => ({
      OR: [
        {
          nombre: {
            contains: palabra,
            mode: 'insensitive',
          },
    const productos = await this.prisma.productos.findMany({
      where,
      include: {
        producto_imagenes: {
          orderBy: { orden: 'asc' },
        },
        {
          descripcion: {
            contains: palabra,
            mode: 'insensitive',
          },
        },
        {
          codigo: {
            contains: palabra,
            mode: 'insensitive',
          },
        },
        {
          categorias: {
            is: {
              nombre: {
                contains: palabra,
                mode: 'insensitive',
              },
            },
          },
        },
        {
          tipos_producto: {
            is: {
              nombre: {
                contains: palabra,
                mode: 'insensitive',
              },
            },
          },
        },
      ],
    })),
  ];
}


  return this.prisma.productos.findMany({
    where,
    include: {
      producto_imagenes: {
        orderBy: { orden: 'asc' },
      },
      categorias: true,
      tipos_producto: true,
      producto_variantes: {
        where: {
          activo: true,
        },
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
    });

    const productosConVendidos = await Promise.all(
      productos.map(async (producto) => {
        const variantesIds = producto.producto_variantes.map(
          (variante) => variante.id
        );

        if (variantesIds.length === 0) {
          return {
            ...producto,
            vendidos: 0,
          };
        }

        const totalVendido = await this.prisma.pedido_items.aggregate({
          where: {
            variante_id: {
              in: variantesIds,
            },
          },
          _sum: {
            cantidad: true,
          },
        });

        return {
          ...producto,
          vendidos: Number(totalVendido._sum.cantidad ?? 0),
        };
      })
    );

    return productosConVendidos;
  }

  async findBySlug(slug: string) {
    return this.prisma.productos.findUnique({
      where: { slug },
      include: {
        producto_imagenes: {
          orderBy: { orden: 'asc' },
        },
        categorias: true,
        tipos_producto: true,
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
        producto_imagenes: {
          orderBy: { orden: 'asc' },
        },
        categorias: true,
        tipos_producto: true,
        producto_variantes: {
          include: {
            tallas: true,
            colores: true,
          },
        },
      },
    });
  }

  async create(data: any) {
    const slugBase = this.generarSlug(data.nombre);

    const codigoGenerado = await this.generarCodigoProducto(
      data.nombre,
      data.categoria_id,
    );

    const tipoProductoId = await this.obtenerTipoProductoId(data.nombre);

    const producto = await this.prisma.productos.create({
      data: {
        categoria_id: data.categoria_id,
        tipo_producto_id: tipoProductoId,
        nombre: data.nombre,
        slug: `${slugBase}-${Date.now()}`,
        codigo: codigoGenerado,
        descripcion: data.descripcion,
        precio: String(data.precio),
        costo: String(data.costo ?? 0),
        activo: data.estado === 'Activo',
        destacado: false,
      },
    });

    if (Array.isArray(data.variantes)) {
      for (const variante of data.variantes) {
        const talla = await this.prisma.tallas.findUnique({
          where: { id: variante.talla_id },
        });

        if (talla) {
          await this.prisma.producto_variantes.create({
            data: {
              producto_id: producto.id,
              talla_id: variante.talla_id,
              color_id: variante.color_id ?? null,
              sku: `${codigoGenerado}-${talla.nombre}`,
              stock: Number(variante.stock ?? 0),
              precio_extra: String(variante.precio_extra ?? 0),
              activo: true,
              peso_kg: String(variante.peso_kg ?? 1),
              largo_cm: String(variante.largo_cm ?? 30),
              ancho_cm: String(variante.ancho_cm ?? 20),
              alto_cm: String(variante.alto_cm ?? 10),
            },
          });
        }
      }
    }

    return this.findOne(producto.id);
  }

  async update(id: string, data: any) {
    const tipoProductoId = await this.obtenerTipoProductoId(data.nombre);

    await this.prisma.productos.update({
      where: { id },
      data: {
        nombre: data.nombre,
        codigo: data.codigo,
        descripcion: data.descripcion,
        precio: String(data.precio),
        costo: String(data.costo ?? 0),
        categoria_id: data.categoria_id,
        tipo_producto_id: tipoProductoId,
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
            peso_kg: Number(variante.peso_kg ?? 1),
            largo_cm: Number(variante.largo_cm ?? 30),
            ancho_cm: Number(variante.ancho_cm ?? 20),
            alto_cm: Number(variante.alto_cm ?? 10),
          },
        });
      }
    }

    return this.findOne(id);
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
        tipo_producto_id: true,
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
        producto_imagenes: {
          orderBy: { orden: 'asc' },
        },
        categorias: true,
        tipos_producto: true,
      },
      take: 4,
      orderBy: {
        created_at: 'desc',
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

    return this.prisma.producto_variantes.create({
      data: {
        producto_id: productoId,
        talla_id: data.talla_id,
        color_id: data.color_id ?? null,
        sku: `${producto.codigo}-${talla.nombre}`,
        stock: Number(data.stock ?? 0),
        precio_extra: String(data.precio_extra ?? 0),
        peso_kg: String(data.peso_kg ?? 1),
        largo_cm: String(data.largo_cm ?? 30),
        ancho_cm: String(data.ancho_cm ?? 20),
        alto_cm: String(data.alto_cm ?? 10),
        activo: true,
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

  async reactivar(id: string) {
  return this.prisma.productos.update({
    where: { id },
    data: {
      activo: true,
      updated_at: new Date(),
    },
  });
}

}
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
    if (texto.includes('sombrero')) return 'SOMB';
    if (texto.includes('camisa')) return 'CAM';
    if (texto.includes('pantalon') || texto.includes('pantalón')) return 'PANT';
    if (texto.includes('cinto') || texto.includes('cinturon') || texto.includes('cinturón')) return 'CINTO';

    return 'PROD';
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

  async findAll() {
    return this.prisma.productos.findMany({
      where: {
        activo: true,
      },
      include: {
        producto_imagenes: {
          orderBy: { orden: 'asc' },
        },
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
      where: { slug },
      include: {
        producto_imagenes: {
          orderBy: { orden: 'asc' },
        },
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
        producto_imagenes: {
          orderBy: { orden: 'asc' },
        },
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

  async create(data: any) {
    const slugBase = this.generarSlug(data.nombre);

    const codigoGenerado = await this.generarCodigoProducto(
      data.nombre,
      data.categoria_id,
    );

    

    const producto = await this.prisma.productos.create({
      data: {
        categoria_id: data.categoria_id,
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
    await this.prisma.productos.update({
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
}
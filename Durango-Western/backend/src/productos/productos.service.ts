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
      include: {
        producto_imagenes: true,
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
      where: {
        id,
      },
      include: {
        producto_imagenes: true,
      },
    });
  }

  async uploadImage(id: string, file: any) {
    const uploaded = await this.storageService.uploadProductImage(file);

    const image = await this.prisma.producto_imagenes.create({
      data: {
        producto_id: id,
        imagen_url: uploaded.url,
        principal: true,
        orden: 1,
      },
    });

    return {
      message: 'Imagen subida correctamente',
      image,
    };
  }
}
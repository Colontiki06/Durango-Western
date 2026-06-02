import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriasService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.categorias.findMany({
      where: {
        activa: true,
      },
      orderBy: {
        orden: 'asc',
      },
    });
  }
}
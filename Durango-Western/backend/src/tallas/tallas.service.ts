import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TallasService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.tallas.findMany({
      orderBy: [
        { tipo: 'asc' },
        { orden: 'asc' },
      ],
    });
  }
}
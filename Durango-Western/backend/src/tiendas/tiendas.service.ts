import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TiendasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.$queryRaw`
      SELECT 
        id,
        name,
        address,
        city,
        state,
        postal_code,
        phone,
        schedule,
        lat::float AS lat,
        lng::float AS lng,
        is_active,
        created_at,
        updated_at
      FROM public.tiendas
      WHERE is_active = true
      ORDER BY name ASC
    `;
  }
}
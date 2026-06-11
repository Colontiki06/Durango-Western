import { Module } from '@nestjs/common';
import { TiendasController } from './tiendas.controller';
import { TiendasService } from './tiendas.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [TiendasController],
  providers: [TiendasService, PrismaService],
})
export class TiendasModule {}
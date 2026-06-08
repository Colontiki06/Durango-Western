import { Module } from '@nestjs/common';

import { DireccionesController } from './direcciones.controller';
import { DireccionesService } from './direcciones.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [DireccionesController],
  providers: [DireccionesService, PrismaService],
})
export class DireccionesModule {}
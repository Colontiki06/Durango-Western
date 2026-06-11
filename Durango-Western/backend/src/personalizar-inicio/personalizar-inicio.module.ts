import { Module } from '@nestjs/common';
import { PersonalizarInicioController } from './personalizar-inicio.controller';
import { PersonalizarInicioService } from './personalizar-inicio.service';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [PersonalizarInicioController],
  providers: [PersonalizarInicioService],
})
export class PersonalizarInicioModule {}
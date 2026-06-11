import { Module } from '@nestjs/common';

import { PedidosController } from './pedidos.controller';
import { PedidosService } from './pedidos.service';

import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CorreosModule } from '../correos/correos.module';

@Module({
  imports: [PrismaModule, AuthModule, CorreosModule],
  controllers: [PedidosController],
  providers: [PedidosService],
})
export class PedidosModule {}
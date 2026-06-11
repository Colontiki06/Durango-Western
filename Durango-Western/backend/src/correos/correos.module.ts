import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CorreosService } from './correos.service';
import { CorreosController } from './correos.controller';

@Module({
  imports: [ConfigModule],
  controllers: [CorreosController],
  providers: [CorreosService],
  exports: [CorreosService],
})
export class CorreosModule {}
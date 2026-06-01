import { Module } from '@nestjs/common';
import { TallasService } from './tallas.service';
import { TallasController } from './tallas.controller';

@Module({
  controllers: [TallasController],
  providers: [TallasService],
})
export class TallasModule {}

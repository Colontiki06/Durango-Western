import { Controller, Get } from '@nestjs/common';
import { TallasService } from './tallas.service';

@Controller('tallas')
export class TallasController {
  constructor(private readonly tallasService: TallasService) {}

  @Get()
  findAll() {
    return this.tallasService.findAll();
  }
}
import { Controller, Get } from '@nestjs/common';
import { TiendasService } from './tiendas.service';

@Controller('tiendas')
export class TiendasController {
  constructor(private readonly tiendasService: TiendasService) {}

  @Get()
  findAll() {
    return this.tiendasService.findAll();
  }
}
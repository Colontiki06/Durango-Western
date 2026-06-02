import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { PedidosService } from './pedidos.service';

@Controller('pedidos')
export class PedidosController {
  constructor(
    private readonly pedidosService: PedidosService,
  ) {}

  @Post()
  create(@Body() body: any) {
    return this.pedidosService.create(body);
  }

  @Get()
  findAll() {
    return this.pedidosService.findAll();
  }

  @Post('test')
test() {
  return {
    mensaje: 'Pedidos funcionando'
  };
}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pedidosService.findOne(id);
  }



}
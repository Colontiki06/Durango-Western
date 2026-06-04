import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

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

  @Patch(':id/estado-envio')
actualizarEstadoEnvio(
  @Param('id') id: string,
  @Body() body: { estado_envio: string },
) {
  return this.pedidosService.actualizarEstadoEnvio(id, body.estado_envio);
}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pedidosService.findOne(id);
  }



}
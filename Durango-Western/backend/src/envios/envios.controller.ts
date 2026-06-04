import { Body, Controller, Get, Post, Param } from '@nestjs/common';
import { EnviosService } from './envios.service';

@Controller('envios')
export class EnviosController {
  constructor(private readonly enviosService: EnviosService) {}

  

  @Post('cotizar')
  cotizar(
    @Body()
    body: {
      codigoPostal: string;
      subtotal: number;
      items: {
        variante_id: string;
        cantidad: number;
      }[];
    },
  ) {
    return this.enviosService.cotizar(
      body.codigoPostal,
      Number(body.subtotal),
      body.items ?? [],
    );
  }

  @Get('probar-skydropx')
probarSkydropx() {
  return this.enviosService.probarConexionSkydropx();
}

@Get('cotizacion/:id')
obtenerCotizacion(@Param('id') id: string) {
  return this.enviosService.obtenerCotizacion(id);
}

@Get('direcciones-skydropx')
obtenerDireccionesSkydropx() {
  return this.enviosService.obtenerDireccionesSkydropx();
}



}
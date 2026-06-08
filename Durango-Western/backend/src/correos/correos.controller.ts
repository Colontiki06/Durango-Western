import { Body, Controller, Post } from '@nestjs/common';

import { CorreosService } from './correos.service';

@Controller('correos')
export class CorreosController {
  constructor(private readonly correosService: CorreosService) {}

  @Post('prueba')
  enviarCorreoPrueba(
    @Body()
    body: {
      correo: string;
      nombre?: string;
    },
  ) {
    return this.correosService.enviarCorreoPrueba({
      correo: body.correo,
      nombre: body.nombre,
    });
  }
}
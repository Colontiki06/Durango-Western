import { Body, Controller, Post, Req } from '@nestjs/common';
import { Request } from 'express';

import { CorreosService } from './correos.service';
import { ContactoDto } from './dto/contacto.dto';

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

  @Post('contacto')
  enviarCorreoContacto(
    @Body() body: ContactoDto,
    @Req() request: Request,
  ) {
    const ip = this.obtenerIpCliente(request) || 'ip-desconocida';

    return this.correosService.enviarCorreoContacto(body, ip);
  }

  private obtenerIpCliente(request: Request): string {
    const forwardedFor = request.headers['x-forwarded-for'];

    if (typeof forwardedFor === 'string') {
      return forwardedFor.split(',')[0].trim();
    }

    if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
      return forwardedFor[0];
    }

    return request.ip || request.socket.remoteAddress || '';
  }
}
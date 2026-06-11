import {
  Body,
  Controller,
  Get,
  Injectable,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

import { PedidosService } from './pedidos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

type UsuarioRequest = {
  id?: string;
  sub?: string;
  email?: string;
  rol?: string;
};

type RequestConUsuario = Request & {
  user?: UsuarioRequest;
};

@Injectable()
class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    if (err || !user) {
      return null;
    }

    return user;
  }
}

@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  create(@Body() body: any, @Req() request: RequestConUsuario) {
    const usuarioId = request.user?.id || request.user?.sub || null;

    return this.pedidosService.create(body, usuarioId);
  }

  @Get('mis-pedidos')
  @UseGuards(JwtAuthGuard)
  findMisPedidos(@Req() request: RequestConUsuario) {
    const usuarioId = request.user?.id || request.user?.sub;

    return this.pedidosService.findMisPedidos(usuarioId as string);
  }

  @Get()
  findAll() {
    return this.pedidosService.findAll();
  }

  @Post('test')
  test() {
    return {
      mensaje: 'Pedidos funcionando',
    };
  }

  @Patch(':id/guia')
  actualizarGuia(
    @Param('id') id: string,
    @Body()
    body: {
      numero_guia?: string;
      paqueteria_id?: string;
      paqueteria_nombre?: string;
      servicio?: string;
    },
  ) {
    return this.pedidosService.actualizarGuia(id, body);
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
import {
  Body,
  Controller,
  Get,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { UsuariosService } from './usuarios.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface RequestConUsuario extends Request {
  user: {
    id: string;
    email: string;
    rol: string;
  };
}

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  obtenerMiPerfil(@Req() req: RequestConUsuario) {
    return this.usuariosService.obtenerMiPerfil(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('me')
  actualizarMiPerfil(
    @Req() req: RequestConUsuario,
    @Body()
    body: {
      nombre?: string;
      telefono?: string | null;
    },
  ) {
    return this.usuariosService.actualizarMiPerfil(req.user.id, body);
  }
}
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { DireccionesService } from './direcciones.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateDireccionDto } from './dto/create-direccion.dto';
import { UpdateDireccionDto } from './dto/update-direccion.dto';

interface RequestConUsuario extends Request {
  user: {
    id: string;
    email: string;
    rol: string;
  };
}

@Controller('direcciones')
export class DireccionesController {
  constructor(private readonly direccionesService: DireccionesService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  obtenerMisDirecciones(@Req() req: RequestConUsuario) {
    return this.direccionesService.obtenerMisDirecciones(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  crearDireccion(
    @Req() req: RequestConUsuario,
    @Body() createDireccionDto: CreateDireccionDto,
  ) {
    return this.direccionesService.crearDireccion(
      req.user.id,
      createDireccionDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  actualizarDireccion(
    @Req() req: RequestConUsuario,
    @Param('id') id: string,
    @Body() updateDireccionDto: UpdateDireccionDto,
  ) {
    return this.direccionesService.actualizarDireccion(
      req.user.id,
      id,
      updateDireccionDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  eliminarDireccion(
    @Req() req: RequestConUsuario,
    @Param('id') id: string,
  ) {
    return this.direccionesService.eliminarDireccion(req.user.id, id);
  }
}
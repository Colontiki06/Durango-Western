import {
  Controller,
  Get,
  Patch,
  Body,
} from '@nestjs/common';

import { ConfiguracionesService } from './configuraciones.service';

@Controller('configuraciones')
export class ConfiguracionesController {

  constructor(
    private readonly service: ConfiguracionesService,
  ) {}

  @Get()
  obtenerConfiguracion() {
    return this.service.obtenerConfiguracion();
  }

  @Patch()
  guardarConfiguracion(
    @Body() body: any,
  ) {
    return this.service.guardarConfiguracion(body);
  }

}
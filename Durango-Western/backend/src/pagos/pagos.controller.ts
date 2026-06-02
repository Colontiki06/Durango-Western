import { Body, Controller, Post } from '@nestjs/common';
import { PagosService } from './pagos.service';

@Controller('pagos')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Post('mercado-pago/preferencia')
  crearPreferencia(@Body() body: any) {
    return this.pagosService.crearPreferencia(body.pedidoId);
  }
}
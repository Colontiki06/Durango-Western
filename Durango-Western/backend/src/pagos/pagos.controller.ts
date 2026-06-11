import { Body, Controller, Post, Query } from '@nestjs/common';

import { PagosService } from './pagos.service';

@Controller('pagos')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Post('mercado-pago/preferencia')
  crearPreferencia(@Body() body: { pedidoId: string }) {
    return this.pagosService.crearPreferencia(body.pedidoId);
  }

  @Post('mercado-pago/webhook')
  webhookMercadoPago(@Body() body: any, @Query() query: any) {
    return this.pagosService.procesarWebhook(body, query);
  }
}
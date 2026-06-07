import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  obtenerResumen() {
    return this.dashboardService.obtenerResumen();
  }

  @Get('ventas-mes')
obtenerVentasMesActual() {
  return this.dashboardService.obtenerVentasMesActual();
}
}
import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Chart } from 'chart.js/auto';

import { ApiService } from '../../core/services/api/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit, AfterViewInit, OnDestroy {

  loading = signal(true);
  error = signal('');

  private chart: Chart | null = null;
  private vistaLista = false;
  private ventasPendientes: any[] = [];

  resumen = signal({
    ventasMes: 0,
    ventasHoy: 0,
    pedidosPagados: 0,
    pedidosPendientes: 0,
    pedidosEnviados: 0,
    pedidosEntregados: 0,
    productosActivos: 0,
    stockBajo: 0,
    productoMasVendido: null as any,
    ultimosPedidos: [] as any[],
    productosStockBajo: [] as any[],
  });

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.cargarDashboard();
    this.cargarVentasMesActual();
  }

  ngAfterViewInit(): void {
    this.vistaLista = true;

    if (this.ventasPendientes.length > 0) {
  setTimeout(() => {
    this.renderizarGrafica(this.ventasPendientes);
  }, 100);
}
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  cargarDashboard(): void {
  this.loading.set(true);
  this.error.set('');

  this.api.get<any>('dashboard').subscribe({
    next: (data) => {
      this.resumen.set({
        ventasMes: Number(data?.ventasMes ?? 0),
        ventasHoy: Number(data?.ventasHoy ?? 0),
        pedidosPagados: Number(data?.pedidosPagados ?? 0),
        pedidosPendientes: Number(data?.pedidosPendientes ?? 0),
        pedidosEnviados: Number(data?.pedidosEnviados ?? 0),
        pedidosEntregados: Number(data?.pedidosEntregados ?? 0),
        productosActivos: Number(data?.productosActivos ?? 0),
        stockBajo: Number(data?.stockBajo ?? 0),
        productoMasVendido: data?.productoMasVendido ?? null,
        ultimosPedidos: Array.isArray(data?.ultimosPedidos)
          ? data.ultimosPedidos
          : [],
          productosStockBajo: Array.isArray(data?.productosStockBajo)
  ? data.productosStockBajo
  : [],
      });

      this.loading.set(false);
      this.cargarVentasMesActual();
    },
    error: (error) => {
      console.error('Error cargando dashboard:', error);
      this.error.set(error?.error?.message || 'No se pudo cargar el dashboard');
      this.loading.set(false);
    }
  });
}

  cargarVentasMesActual(): void {
  this.api.get<any[]>('dashboard/ventas-mes').subscribe({
    next: (data) => {
      const ventas = Array.isArray(data) ? data : [];

      this.ventasPendientes = ventas;

      if (this.vistaLista) {
        setTimeout(() => {
          this.renderizarGrafica(ventas);
        }, 100);
      }
    },
    error: (error) => {
      console.error('Error cargando gráfica de ventas:', error);
    }
  });
}

  private renderizarGrafica(data: any[]): void {
  setTimeout(() => {
    const canvas = document.getElementById('ventasChartCanvas') as HTMLCanvasElement | null;

    if (!canvas) {
      console.log('No se encontró el canvas ventasChartCanvas');
      return;
    }

    this.chart?.destroy();

    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: data.map(item => item.label),
        datasets: [
          {
            label: 'Ventas',
            data: data.map(item => Number(item.ventas ?? 0)),
            tension: 0.4,
            fill: true,
            borderWidth: 4,
            borderColor: '#9b6235',
            backgroundColor: 'rgba(155,98,53,0.12)',
            pointRadius: 5,
            pointHoverRadius: 8,
            pointBackgroundColor: '#9b6235',
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: '#2f1b12',
            titleColor: '#fff',
            bodyColor: '#fff',
            padding: 12,
            callbacks: {
              label: (context) => {
                const valor = Number(context.raw ?? 0);

                return valor.toLocaleString('es-MX', {
                  style: 'currency',
                  currency: 'MXN',
                });
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              maxTicksLimit: 8,
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => {
                return '$' + Number(value).toLocaleString('es-MX');
              }
            }
          }
        }
      }
    });
  }, 300);
}
}
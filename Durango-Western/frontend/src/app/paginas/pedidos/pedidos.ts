import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

import { OrdersService, Pedido } from '../../core/services/orders/orders';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.css'
})
export class Pedidos implements OnInit {

  pedidos: Pedido[] = [];
  pedidoSeleccionado: Pedido | null = null;

  modalDetalle = false;
  modalRastreo = false;

  loading = false;
  errorMessage = '';

  private isBrowser = false;

  constructor(
    private ordersService: OrdersService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.cargarPedidosDemo();

    if (this.isBrowser) {
      this.cargarPedidos();
    }
  }

  cargarPedidos(): void {
    this.loading = true;
    this.errorMessage = '';

    this.ordersService.getPedidosCliente().subscribe({
      next: (pedidos) => {
        if (pedidos && pedidos.length > 0) {
          this.pedidos = pedidos;
        }

        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  cargarPedidosDemo(): void {
    this.pedidos = [
      {
        id: 'DW-0001',
        fecha: '18 mayo 2026',
        estado: 'En camino',
        producto: 'Bota Durango Rugged Pro',
        talla: '28',
        total: 2399,
        imagen: '/img/BotasCaballero.PNG',
        metodoPago: 'Visa terminación 4582',
        metodoEnvio: 'Envío estándar',
        direccion: 'Benito Díaz #408, Col. Industrial Ladrillera, Durango, Dgo. CP 34289',
        guia: 'DHL-83920177',
        paqueteria: 'DHL',
        fechaEstimada: '22 mayo 2026'
      },
      {
        id: 'DW-0002',
        fecha: '14 mayo 2026',
        estado: 'Entregado',
        producto: 'Sombrero Durango Western Premium',
        talla: 'Única',
        total: 1499,
        imagen: '/img/Sombreros.png',
        metodoPago: 'Mastercard terminación 1123',
        metodoEnvio: 'Envío estándar',
        direccion: 'Av. Universidad #120, Durango, Dgo. CP 34000',
        guia: 'FDX-66291045',
        paqueteria: 'FedEx',
        fechaEstimada: '17 mayo 2026'
      }
    ];
  }

  abrirDetalle(pedido: Pedido): void {
    this.pedidoSeleccionado = pedido;
    this.modalDetalle = true;
    this.modalRastreo = false;
  }

  abrirRastreo(pedido: Pedido): void {
    this.pedidoSeleccionado = pedido;
    this.modalRastreo = true;
    this.modalDetalle = false;
  }

  cerrarModal(): void {
    this.pedidoSeleccionado = null;
    this.modalDetalle = false;
    this.modalRastreo = false;
  }

}
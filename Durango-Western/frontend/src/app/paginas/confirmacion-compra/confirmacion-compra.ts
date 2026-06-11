import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, CurrencyPipe, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { CartService } from '../../core/services/cart/cart.service';

type EstadoCompra = 'exitoso' | 'pendiente' | 'fallido';

@Component({
  selector: 'app-confirmacion-compra',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe],
  templateUrl: './confirmacion-compra.html',
  styleUrl: './confirmacion-compra.css',
})
export class ConfirmacionCompra implements OnInit {
  estado: EstadoCompra = 'pendiente';
  pedido: any = null;
  isBrowser = false;

  private carritoLimpiado = false;

  constructor(
    private route: ActivatedRoute,
    private cartService: CartService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.estado = this.resolverEstadoCompra();

    if (!this.isBrowser) {
      return;
    }

    this.cargarPedidoGuardado();

    if (this.estado === 'exitoso') {
      this.limpiarCarritoCompraConcretada();
    }
  }

  private resolverEstadoCompra(): EstadoCompra {
    const ruta = this.route.snapshot.routeConfig?.path ?? '';

    const status = this.obtenerQueryParam('status');
    const collectionStatus = this.obtenerQueryParam('collection_status');
    const paymentStatus = this.obtenerQueryParam('payment_status');

    const valores = [status, collectionStatus, paymentStatus].map((valor) =>
      valor.toLowerCase(),
    );

    if (
      valores.includes('approved') ||
      valores.includes('accredited') ||
      valores.includes('success')
    ) {
      return 'exitoso';
    }

    if (
      valores.includes('pending') ||
      valores.includes('in_process') ||
      ruta.includes('pago-pendiente')
    ) {
      return 'pendiente';
    }

    if (
      valores.includes('rejected') ||
      valores.includes('failure') ||
      valores.includes('failed') ||
      valores.includes('cancelled') ||
      valores.includes('canceled') ||
      ruta.includes('pago-fallido')
    ) {
      return 'fallido';
    }

    /**
     * Para sandbox/demo:
     * Si Mercado Pago regresa a /pago-exitoso sin query params,
     * se toma como compra exitosa y se limpia el carrito.
     */
    if (ruta.includes('pago-exitoso')) {
      return 'exitoso';
    }

    return 'pendiente';
  }

  private obtenerQueryParam(nombre: string): string {
    return this.route.snapshot.queryParamMap.get(nombre)?.toLowerCase() ?? '';
  }

  private cargarPedidoGuardado(): void {
    const pedidoGuardado = localStorage.getItem('pedido_actual');

    if (!pedidoGuardado) {
      this.pedido = null;
      return;
    }

    try {
      this.pedido = JSON.parse(pedidoGuardado);
    } catch {
      localStorage.removeItem('pedido_actual');
      this.pedido = null;
    }
  }

  private limpiarCarritoCompraConcretada(): void {
    if (this.carritoLimpiado) {
      return;
    }

    this.cartService.clearCart();
    this.carritoLimpiado = true;
  }

  titulo(): string {
    if (this.estado === 'exitoso') {
      return '¡Compra confirmada!';
    }

    if (this.estado === 'pendiente') {
      return 'Pago pendiente';
    }

    return 'Pago no completado';
  }

  mensaje(): string {
    if (this.estado === 'exitoso') {
      return 'Gracias por tu compra. Hemos recibido tu pedido correctamente.';
    }

    if (this.estado === 'pendiente') {
      return 'Tu pago está pendiente de confirmación. Tu carrito se conserva hasta que el pago sea aprobado.';
    }

    return 'No pudimos completar el pago. Tu carrito se conserva para que puedas intentarlo nuevamente.';
  }

  icono(): string {
    if (this.estado === 'exitoso') {
      return '✓';
    }

    if (this.estado === 'pendiente') {
      return '!';
    }

    return '×';
  }
}
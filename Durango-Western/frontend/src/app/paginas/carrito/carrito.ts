import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { CartService, CartItem } from '../../core/services/cart/cart.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { ApiService } from '../../core/services/api/api.service';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe],
  templateUrl: './carrito.html',
  styleUrl: './carrito.css',
})
export class Carrito implements OnInit {
  private cdr = inject(ChangeDetectorRef);

  envioGratisMinimo = 4000;
  comprasInvitado = true;
  cargandoConfiguracion = true;

  mensajeError = '';

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private router: Router,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.cargarConfiguracionTienda();
  }

  cargarConfiguracionTienda(): void {
  this.cargandoConfiguracion = true;

  this.api.get<any>('configuraciones').subscribe({
    next: (config) => {
      this.envioGratisMinimo = Number(config?.envio_gratis_desde ?? 4000);
      this.comprasInvitado = Boolean(config?.compras_invitado ?? true);
      this.cargandoConfiguracion = false;
      this.cdr.detectChanges();
    },
    error: (error) => {
      console.error('Error cargando configuración de tienda:', error);
      this.envioGratisMinimo = 4000;
      this.comprasInvitado = true;
      this.cargandoConfiguracion = false;
      this.cdr.detectChanges();
    }
  });
}

  items(): CartItem[] {
    return this.cartService.cartItems;
  }

  increase(item: CartItem): void {
    const cantidadNueva = item.cantidad + 1;

    if (item.stock !== undefined && cantidadNueva > item.stock) {
      this.mostrarError('No hay suficiente stock disponible para este producto.');
      return;
    }

    this.cartService.increaseQuantity(item.id, item.variante_id);
    this.cdr.detectChanges();
  }

  decrease(item: CartItem): void {
    this.cartService.decreaseQuantity(item.id, item.variante_id);
    this.cdr.detectChanges();
  }

  remove(item: CartItem): void {
    const confirmar = confirm(`¿Eliminar "${item.nombre}" del carrito?`);

    if (!confirmar) return;

    this.cartService.removeFromCart(item.id, item.variante_id);
    this.cdr.detectChanges();
  }

  subtotal(): number {
    return this.cartService.getSubtotal();
  }

  carritoVacio(): boolean {
    return this.items().length === 0;
  }

  totalArticulos(): number {
    return this.items().reduce(
      (total, item) => total + item.cantidad,
      0
    );
  }

  faltaParaEnvioGratis(): number {
    return Math.max(this.envioGratisMinimo - this.subtotal(), 0);
  }

  porcentajeEnvioGratis(): number {
    if (this.envioGratisMinimo <= 0) return 100;

    return Math.min(
      (this.subtotal() / this.envioGratisMinimo) * 100,
      100
    );
  }

  tieneEnvioGratis(): boolean {
    return this.subtotal() >= this.envioGratisMinimo;
  }

  estaLogueado(): boolean {
    return this.authService.isAuthenticated();
  }

  continuarAlCheckout(): void {
    if (this.carritoVacio()) {
      this.mostrarError('Tu carrito está vacío.');
      return;
    }

    this.router.navigate(['/checkout']);
  }

  continuarComoInvitado(): void {
    if (this.carritoVacio()) {
      this.mostrarError('Tu carrito está vacío.');
      return;
    }

    if (!this.comprasInvitado) {
      this.mostrarError('Las compras como invitado están desactivadas. Inicia sesión para continuar.');
      this.iniciarSesionYComprar();
      return;
    }

    this.router.navigate(['/checkout']);
  }

  iniciarSesionYComprar(): void {
    if (this.carritoVacio()) {
      this.mostrarError('Tu carrito está vacío.');
      return;
    }

    this.router.navigate(['/login'], {
      queryParams: {
        redirect: '/checkout',
      },
    });
  }

  mostrarError(mensaje: string): void {
    this.mensajeError = mensaje;
    this.cdr.detectChanges();

    setTimeout(() => {
      this.mensajeError = '';
      this.cdr.detectChanges();
    }, 3000);
  }

  


}
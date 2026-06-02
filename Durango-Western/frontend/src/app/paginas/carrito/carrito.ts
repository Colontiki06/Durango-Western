import { Component } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { CartService, CartItem } from '../../core/services/cart/cart.service';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe],
  templateUrl: './carrito.html',
  styleUrl: './carrito.css'
})
export class Carrito {
  readonly envioGratisMinimo = 4000;

  constructor(private cartService: CartService) {}

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
}
  decrease(item: CartItem): void {
    this.cartService.decreaseQuantity(item.id, item.variante_id);
  }

  remove(item: CartItem): void {
    const confirmar = confirm(`¿Eliminar "${item.nombre}" del carrito?`);

    if (!confirmar) return;

    this.cartService.removeFromCart(item.id, item.variante_id);
  }

  subtotal(): number {
    return this.cartService.getSubtotal();
  }

  carritoVacio(): boolean {
    return this.items().length === 0;
  }

  totalArticulos(): number {
    return this.items().reduce((total, item) => total + item.cantidad, 0);
  }

  faltaParaEnvioGratis(): number {
    return Math.max(this.envioGratisMinimo - this.subtotal(), 0);
  }

  porcentajeEnvioGratis(): number {
    return Math.min((this.subtotal() / this.envioGratisMinimo) * 100, 100);
  }

  tieneEnvioGratis(): boolean {
    return this.subtotal() >= this.envioGratisMinimo;
  }

  mensajeError = '';

mostrarError(mensaje: string): void {
  this.mensajeError = mensaje;

  setTimeout(() => {
    this.mensajeError = '';
  }, 3000);
}
}
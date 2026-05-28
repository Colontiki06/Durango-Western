import { Component } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart/cart.service';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe],
  templateUrl: './carrito.html',
  styleUrl: './carrito.css'
})
export class Carrito {
  constructor(private cartService: CartService) {}

  items() {
    return this.cartService.cartItems;
  }

  increase(id: string | number, talla?: string): void {
    this.cartService.increaseQuantity(id, talla);
  }

  decrease(id: string | number, talla?: string): void {
    this.cartService.decreaseQuantity(id, talla);
  }

  remove(id: string | number, talla?: string): void {
    this.cartService.removeFromCart(id, talla);
  }

  subtotal(): number {
    return this.cartService.getSubtotal();
  }
}
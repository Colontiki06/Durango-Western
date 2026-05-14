import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-carrito',
  imports: [RouterLink],
  templateUrl: './carrito.html',
  styleUrl: './carrito.css'
})
export class Carrito {
  cartService = inject(CartService);

  items = this.cartService.cartItems;

  increase(id: string, talla: string): void {
    this.cartService.increaseQuantity(id, talla);
  }

  decrease(id: string, talla: string): void {
    this.cartService.decreaseQuantity(id, talla);
  }

  remove(id: string, talla: string): void {
    this.cartService.removeFromCart(id, talla);
  }

  subtotal(): number {
    return this.cartService.getSubtotal();
  }
}
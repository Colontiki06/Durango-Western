import { Component } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { CartService } from '../../core/services/cart/cart.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css'
})
export class Checkout {

  constructor(private cartService: CartService) {}

  items() {
    return this.cartService.cartItems;
  }

  subtotal(): number {
    return this.cartService.getSubtotal();
  }

  getSubtotal(): number {
    return this.cartService.getSubtotal();
  }

}
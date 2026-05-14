import { Component, inject } from '@angular/core';

import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-checkout',
  imports: [],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css'
})
export class Checkout {

  private cartService = inject(CartService);

  items = this.cartService.cartItems;

  subtotal(): number {
    return this.cartService.getSubtotal();
  }

}
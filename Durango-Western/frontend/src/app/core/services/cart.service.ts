import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface CartItem {
  id: string;
  nombre: string;
  precio: number;
  talla: string;
  cantidad: number;
  imagen?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly CART_KEY = 'dw_cart';

  private platformId = inject(PLATFORM_ID);

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  cartItems = signal<CartItem[]>(this.loadCart());

  private loadCart(): CartItem[] {
    if (!this.isBrowser) {
      return [];
    }

    const cart = localStorage.getItem(this.CART_KEY);
    return cart ? JSON.parse(cart) : [];
  }

  private saveCart(): void {
    if (!this.isBrowser) {
      return;
    }

    localStorage.setItem(
      this.CART_KEY,
      JSON.stringify(this.cartItems())
    );
  }

  addToCart(item: CartItem): void {
    const items = this.cartItems();

    const existingItem = items.find(
      product => product.id === item.id && product.talla === item.talla
    );

    if (existingItem) {
      existingItem.cantidad += item.cantidad;
      this.cartItems.set([...items]);
    } else {
      this.cartItems.set([...items, item]);
    }

    this.saveCart();
  }

  removeFromCart(id: string, talla: string): void {
    const items = this.cartItems().filter(
      item => !(item.id === id && item.talla === talla)
    );

    this.cartItems.set(items);
    this.saveCart();
  }

  increaseQuantity(id: string, talla: string): void {
    const items = this.cartItems().map(item =>
      item.id === id && item.talla === talla
        ? { ...item, cantidad: item.cantidad + 1 }
        : item
    );

    this.cartItems.set(items);
    this.saveCart();
  }

  decreaseQuantity(id: string, talla: string): void {
    const items = this.cartItems()
      .map(item =>
        item.id === id && item.talla === talla
          ? { ...item, cantidad: item.cantidad - 1 }
          : item
      )
      .filter(item => item.cantidad > 0);

    this.cartItems.set(items);
    this.saveCart();
  }

  clearCart(): void {
    this.cartItems.set([]);

    if (this.isBrowser) {
      localStorage.removeItem(this.CART_KEY);
    }
  }

  getSubtotal(): number {
    return this.cartItems().reduce(
      (total, item) => total + item.precio * item.cantidad,
      0
    );
  }
}
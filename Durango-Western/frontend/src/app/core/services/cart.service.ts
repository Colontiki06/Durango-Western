import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CartItem {
  id: string | number;
  nombre: string;
  precio: number;
  cantidad: number;
  talla?: string;
  imagen?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly storageKey = 'durango_cart';

  private cartItemsSubject = new BehaviorSubject<CartItem[]>(
    this.loadCartFromStorage()
  );

  cartItems$ = this.cartItemsSubject.asObservable();

  get cartItems(): CartItem[] {
    return this.cartItemsSubject.value;
  }

  getTotalItems(): number {
    return this.cartItems.reduce((total, item) => total + item.cantidad, 0);
  }

  addToCart(product: CartItem): void {
    const currentItems = this.cartItems;

    const existingItem = currentItems.find(
      item => item.id === product.id && item.talla === product.talla
    );

    let updatedItems: CartItem[];

    if (existingItem) {
      updatedItems = currentItems.map(item =>
        item.id === product.id && item.talla === product.talla
          ? { ...item, cantidad: item.cantidad + product.cantidad }
          : item
      );
    } else {
      updatedItems = [...currentItems, product];
    }

    this.updateCart(updatedItems);
  }

  increaseQuantity(id: string | number, talla?: string): void {
    const updatedItems = this.cartItems.map(item =>
      item.id === id && item.talla === talla
        ? { ...item, cantidad: item.cantidad + 1 }
        : item
    );

    this.updateCart(updatedItems);
  }

  decreaseQuantity(id: string | number, talla?: string): void {
    const updatedItems = this.cartItems
      .map(item =>
        item.id === id && item.talla === talla
          ? { ...item, cantidad: item.cantidad - 1 }
          : item
      )
      .filter(item => item.cantidad > 0);

    this.updateCart(updatedItems);
  }

  removeFromCart(id: string | number, talla?: string): void {
    const updatedItems = this.cartItems.filter(
      item => !(item.id === id && item.talla === talla)
    );

    this.updateCart(updatedItems);
  }

  getSubtotal(): number {
    return this.cartItems.reduce(
      (total, item) => total + item.precio * item.cantidad,
      0
    );
  }

  clearCart(): void {
    this.updateCart([]);
  }

  private updateCart(items: CartItem[]): void {
    if (this.isBrowser()) {
      localStorage.setItem(this.storageKey, JSON.stringify(items));
    }

    this.cartItemsSubject.next(items);
  }

  private loadCartFromStorage(): CartItem[] {
    if (!this.isBrowser()) {
      return [];
    }

    const cart = localStorage.getItem(this.storageKey);

    if (!cart) {
      return [];
    }

    try {
      return JSON.parse(cart) as CartItem[];
    } catch {
      localStorage.removeItem(this.storageKey);
      return [];
    }
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }
}
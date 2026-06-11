import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CartItem {
  id: string | number;
  producto_id?: string;
  variante_id?: string | null;
  nombre: string;
  codigo?: string;
  precio: number;
  cantidad: number;
  talla?: string | null;
  stock?: number;
  imagen?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly storageKey = 'durango_cart';

  private cartItemsSubject = new BehaviorSubject<CartItem[]>(
    this.loadCartFromStorage(),
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
      (item) =>
        item.id === product.id && item.variante_id === product.variante_id,
    );

    let updatedItems: CartItem[];

    if (existingItem) {
      updatedItems = currentItems.map((item) => {
        if (
          item.id === product.id &&
          item.variante_id === product.variante_id
        ) {
          const nuevaCantidad = item.cantidad + product.cantidad;

          if (item.stock !== undefined && nuevaCantidad > item.stock) {
            alert('No hay suficiente stock disponible');
            return item;
          }

          return {
            ...item,
            cantidad: nuevaCantidad,
          };
        }

        return item;
      });
    } else {
      updatedItems = [...currentItems, product];
    }

    this.updateCart(updatedItems);
  }

  increaseQuantity(id: string | number, variante_id?: string | null): void {
    const updatedItems = this.cartItems.map((item) => {
      if (item.id === id && item.variante_id === variante_id) {
        const nuevaCantidad = item.cantidad + 1;

        if (item.stock !== undefined && nuevaCantidad > item.stock) {
          alert('No hay suficiente stock disponible');
          return item;
        }

        return {
          ...item,
          cantidad: nuevaCantidad,
        };
      }

      return item;
    });

    this.updateCart(updatedItems);
  }

  decreaseQuantity(id: string | number, variante_id?: string | null): void {
    const updatedItems = this.cartItems
      .map((item) =>
        item.id === id && item.variante_id === variante_id
          ? { ...item, cantidad: item.cantidad - 1 }
          : item,
      )
      .filter((item) => item.cantidad > 0);

    this.updateCart(updatedItems);
  }

  removeFromCart(id: string | number, variante_id?: string | null): void {
    const updatedItems = this.cartItems.filter(
      (item) => !(item.id === id && item.variante_id === variante_id),
    );

    this.updateCart(updatedItems);
  }

  getSubtotal(): number {
    return this.cartItems.reduce(
      (total, item) => total + item.precio * item.cantidad,
      0,
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
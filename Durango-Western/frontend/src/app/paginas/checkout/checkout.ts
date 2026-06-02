import { Component } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { CartService, CartItem } from '../../core/services/cart/cart.service';
import { ApiService } from '../../core/services/api/api.service';

type TipoEntrega = 'domicilio' | 'tienda';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, FormsModule, RouterLink],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css'
})
export class Checkout {

  readonly envioGratisMinimo = 4000;

  cargando = false;
  tipoEntrega: TipoEntrega = 'domicilio';

  cliente = {
    nombre: '',
    correo: '',
    telefono: ''
  };

  direccion = {
    codigoPostal: '',
    calle: '',
    numeroExterior: '',
    numeroInterior: '',
    colonia: '',
    ciudad: '',
    estado: '',
    referencias: ''
  };

  constructor(
    private cartService: CartService,
    private api: ApiService
  ) {}

  items(): CartItem[] {
    return this.cartService.cartItems;
  }

  subtotal(): number {
    return this.cartService.getSubtotal();
  }

  envio(): number {
    return 0;
  }

  total(): number {
    return this.subtotal() + this.envio();
  }

  carritoVacio(): boolean {
    return this.items().length === 0;
  }

  seleccionarEntrega(tipo: TipoEntrega): void {
    this.tipoEntrega = tipo;
  }

  realizarPedido(): void {
    if (this.carritoVacio()) {
      alert('Tu carrito está vacío');
      return;
    }

    if (!this.cliente.nombre || !this.cliente.correo || !this.cliente.telefono) {
      alert('Completa tus datos de contacto');
      return;
    }

    this.cargando = true;

    const payload = {
      cliente: this.cliente,
      direccion: this.tipoEntrega === 'domicilio' ? this.direccion : null,
      tipoEntrega: this.tipoEntrega,
      items: this.items().map(item => ({
        producto_id: item.producto_id || item.id,
        variante_id: item.variante_id,
        nombre: item.nombre,
        codigo: item.codigo,
        talla: item.talla,
        precio: item.precio,
        cantidad: item.cantidad
      }))
    };

    this.api.post<any>('pedidos', payload).subscribe({
      next: (pedido) => {
        localStorage.setItem('pedido_actual', JSON.stringify(pedido));

        this.api.post<any>('pagos/mercado-pago/preferencia', {
          pedidoId: pedido.id
        }).subscribe({
          next: (respuesta) => {
            const urlPago = respuesta.sandbox_init_point || respuesta.init_point;

            if (!urlPago) {
              alert('No se pudo generar la liga de pago.');
              this.cargando = false;
              return;
            }

            window.location.href = urlPago;
          },
          error: (error) => {
            console.error('Error creando preferencia:', error);
            alert('El pedido fue creado, pero no se pudo iniciar el pago.');
            this.cargando = false;
          }
        });
      },
      error: (error) => {
        console.error('Error creando pedido:', error);
        alert(error?.error?.message || 'No fue posible crear el pedido.');
        this.cargando = false;
      }
    });
  }
}
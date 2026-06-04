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
  cotizandoEnvio = false;
  tipoEntrega: TipoEntrega = 'domicilio';

  costoEnvio = 0;
  envioGratis = false;
  mensajeEnvio = '';

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
    if (this.tipoEntrega === 'tienda') return 0;
    return this.costoEnvio;
  }

  total(): number {
    return this.subtotal() + this.envio();
  }

  carritoVacio(): boolean {
    return this.items().length === 0;
  }

  seleccionarEntrega(tipo: TipoEntrega): void {
    this.tipoEntrega = tipo;

    if (tipo === 'tienda') {
      this.costoEnvio = 0;
      this.envioGratis = true;
      this.mensajeEnvio = 'Recolección en tienda sin costo';
    }

    if (tipo === 'domicilio') {
      this.cotizarEnvio();
    }
  }

  cotizarEnvio(): void {
    if (this.tipoEntrega !== 'domicilio') return;

    if (!this.direccion.codigoPostal || this.direccion.codigoPostal.length < 5) {
      this.costoEnvio = 0;
      this.envioGratis = false;
      this.mensajeEnvio = 'Ingresa tu código postal para calcular el envío';
      return;
    }

    this.cotizandoEnvio = true;
    this.mensajeEnvio = 'Calculando envío...';

    this.api.post<any>('envios/cotizar', {
  codigoPostal: this.direccion.codigoPostal,
  subtotal: this.subtotal(),
  items: this.items()
  .filter(item => !!item.variante_id)
  .map(item => ({
    variante_id: item.variante_id,
    cantidad: item.cantidad
  }))
}).subscribe({
      next: (respuesta) => {
        this.costoEnvio = Number(respuesta.costoEnvio ?? 0);
        this.envioGratis = Boolean(respuesta.envioGratis);

        this.mensajeEnvio = this.envioGratis
          ? 'Tu compra tiene envío gratis'
          : `Costo de envío calculado`;

        this.cotizandoEnvio = false;
      },
      error: (error) => {
        console.error('Error cotizando envío:', error);
        this.costoEnvio = 0;
        this.envioGratis = false;
        this.mensajeEnvio = 'No se pudo calcular el envío';
        this.cotizandoEnvio = false;
      }
    });
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

    if (this.tipoEntrega === 'domicilio') {
      if (
        !this.direccion.codigoPostal ||
        !this.direccion.calle ||
        !this.direccion.numeroExterior ||
        !this.direccion.colonia ||
        !this.direccion.ciudad ||
        !this.direccion.estado
      ) {
        alert('Completa tu dirección de envío');
        return;
      }
    }

    this.cargando = true;

    const payload = {
      cliente: this.cliente,
      direccion: this.tipoEntrega === 'domicilio' ? this.direccion : null,
      tipoEntrega: this.tipoEntrega,
      envio: this.envio(),
      subtotal: this.subtotal(),
      total: this.total(),
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
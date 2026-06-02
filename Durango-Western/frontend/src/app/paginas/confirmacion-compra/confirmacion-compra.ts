import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, CurrencyPipe, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart/cart.service';

@Component({
  selector: 'app-confirmacion-compra',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe],
  templateUrl: './confirmacion-compra.html',
  styleUrl: './confirmacion-compra.css'
})
export class ConfirmacionCompra implements OnInit {

  estado: 'exitoso' | 'pendiente' | 'fallido' = 'exitoso';
  pedido: any = null;
  isBrowser = false;

  constructor(
    private route: ActivatedRoute,
    private cartService: CartService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    const url = this.route.snapshot.routeConfig?.path ?? '';

    if (url.includes('pago-pendiente')) this.estado = 'pendiente';
    if (url.includes('pago-fallido')) this.estado = 'fallido';

    const status = this.route.snapshot.queryParamMap.get('status');
    const collectionStatus = this.route.snapshot.queryParamMap.get('collection_status');

    if (url.includes('pago-exitoso') || status === 'approved' || collectionStatus === 'approved') {
      this.estado = 'exitoso';

      if (this.isBrowser) {
        this.cartService.clearCart();
      }
    }

    if (!this.isBrowser) return;

    const pedidoGuardado = localStorage.getItem('pedido_actual');

    if (pedidoGuardado) {
      this.pedido = JSON.parse(pedidoGuardado);
    }
  }

  titulo(): string {
    if (this.estado === 'exitoso') return '¡Compra confirmada!';
    if (this.estado === 'pendiente') return 'Pago pendiente';
    return 'Pago no completado';
  }

  mensaje(): string {
    if (this.estado === 'exitoso') return 'Gracias por tu compra. Hemos recibido tu pedido correctamente.';
    if (this.estado === 'pendiente') return 'Tu pago está pendiente de confirmación. Te avisaremos cuando se procese.';
    return 'No pudimos completar el pago. Puedes intentarlo nuevamente.';
  }

  icono(): string {
    if (this.estado === 'exitoso') return '✓';
    if (this.estado === 'pendiente') return '!';
    return '×';
  }
}
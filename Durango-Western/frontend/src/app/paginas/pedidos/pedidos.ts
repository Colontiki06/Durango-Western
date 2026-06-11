import { CommonModule, CurrencyPipe, DatePipe, isPlatformBrowser } from '@angular/common';
import {
  Component,
  Inject,
  OnInit,
  PLATFORM_ID,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth/auth.service';

interface PedidoItem {
  id: string;
  pedido_id: string;
  producto_id: string;
  variante_id?: string | null;
  nombre_producto: string;
  sku?: string | null;
  talla?: string | null;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

interface EnvioPedido {
  id: string;
  pedido_id: string;
  estado?: string | null;
  servicio?: string | null;
  costo?: number | null;
  dias_estimados?: number | null;
  numero_guia?: string | null;
  fecha_envio?: string | null;
  fecha_entrega?: string | null;
  paqueterias?: {
    id: string;
    nombre: string;
  } | null;
}

interface DireccionPedido {
  id?: string;
  nombre_recibe?: string | null;
  telefono?: string | null;
  calle?: string | null;
  numero?: string | null;
  colonia?: string | null;
  ciudad?: string | null;
  estado?: string | null;
  codigo_postal?: string | null;
  referencias?: string | null;
}

interface PedidoUsuario {
  id: string;
  folio?: string | null;
  subtotal: number;
  envio: number;
  total: number;
  estado?: string | null;
  estado_envio?: string | null;
  tipo_entrega?: string | null;
  metodo_pago?: string | null;
  notas?: string | null;
  created_at?: string;
  updated_at?: string;
  pedido_items?: PedidoItem[];
  envios?: EnvioPedido[];
  direcciones?: DireccionPedido | null;
}

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.css',
})
export class Pedidos implements OnInit {
  pedidos: PedidoUsuario[] = [];
  pedidoSeleccionado: PedidoUsuario | null = null;

  private cdr = inject(ChangeDetectorRef);

  modalDetalle = false;
  modalRastreo = false;

  loading = false;
  errorMessage = '';

  private isBrowser = false;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) {
      return;
    }

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], {
        queryParams: {
          redirect: '/pedidos',
        },
      });
      return;
    }

    this.cargarPedidos();
  }

  cargarPedidos(): void {
    const token = this.authService.getToken();

    if (!token) {
      this.router.navigate(['/login'], {
        queryParams: {
          redirect: '/pedidos',
        },
      });
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.http
      .get<PedidoUsuario[]>(`${environment.apiUrl}/pedidos/mis-pedidos`, {
        headers: this.getAuthHeaders(),
      })
      .subscribe({
        next: (pedidos) => {
          this.pedidos = pedidos || [];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.loading = false;

          if (error.status === 401) {
            this.authService.logout();
            this.router.navigate(['/login'], {
              queryParams: {
                redirect: '/pedidos',
              },
            });
            this.cdr.detectChanges();
            return;
          }

          if (error.status === 0) {
            this.errorMessage = 'No se pudo conectar con el servidor.';
            this.cdr.detectChanges();
            return;
          }

          this.errorMessage =
            'No se pudieron cargar tus compras. Intenta nuevamente.';
          this.cdr.detectChanges();
        },
      });
  }

  abrirDetalle(pedido: PedidoUsuario): void {
    this.pedidoSeleccionado = pedido;
    this.modalDetalle = true;
    this.modalRastreo = false;
    this.cdr.detectChanges();
  }

  abrirRastreo(pedido: PedidoUsuario): void {
    this.pedidoSeleccionado = pedido;
    this.modalRastreo = true;
    this.modalDetalle = false;
    this.cdr.detectChanges();
  }

  cerrarModal(): void {
    this.pedidoSeleccionado = null;
    this.modalDetalle = false;
    this.modalRastreo = false;
    this.cdr.detectChanges();
  }

  obtenerItems(pedido: PedidoUsuario): PedidoItem[] {
    return pedido.pedido_items || [];
  }

  obtenerEnvio(pedido: PedidoUsuario): EnvioPedido | null {
    return pedido.envios?.[0] || null;
  }

  obtenerFolio(pedido: PedidoUsuario): string {
    return pedido.folio || `#${pedido.id}`;
  }

  obtenerTotalProductos(pedido: PedidoUsuario): number {
    return this.obtenerItems(pedido).reduce(
      (total, item) => total + Number(item.cantidad || 0),
      0
    );
  }

  obtenerEstadoPedido(pedido: PedidoUsuario): string {
    const estado = pedido.estado || 'pendiente';

    const estados: Record<string, string> = {
      pendiente: 'Pendiente',
      pagado: 'Pagado',
      aprobado: 'Aprobado',
      cancelado: 'Cancelado',
      fallido: 'Fallido',
    };

    return estados[estado] || estado;
  }

  obtenerEstadoEnvio(pedido: PedidoUsuario): string {
    const estado =
      pedido.estado_envio || this.obtenerEnvio(pedido)?.estado || 'pendiente';

    const estados: Record<string, string> = {
      pendiente: 'Pendiente',
      preparando: 'Preparando',
      empacado: 'Empacado',
      enviado: 'Enviado',
      en_camino: 'En camino',
      listo_recoger: 'Listo para recoger',
      entregado: 'Entregado',
      cancelado: 'Cancelado',
    };

    return estados[estado] || estado;
  }

  obtenerClaseEstadoPedido(pedido: PedidoUsuario): string {
    const estado = pedido.estado || 'pendiente';

    if (estado === 'pagado' || estado === 'aprobado') {
      return 'bg-green-100 text-green-700 border-green-300';
    }

    if (estado === 'cancelado' || estado === 'fallido') {
      return 'bg-red-100 text-red-700 border-red-300';
    }

    return 'bg-yellow-100 text-yellow-700 border-yellow-300';
  }

  obtenerClaseEstadoEnvio(pedido: PedidoUsuario): string {
    const estado =
      pedido.estado_envio || this.obtenerEnvio(pedido)?.estado || 'pendiente';

    if (estado === 'entregado') {
      return 'bg-green-100 text-green-700 border-green-300';
    }

    if (estado === 'enviado' || estado === 'en_camino') {
      return 'bg-blue-100 text-blue-700 border-blue-300';
    }

    if (estado === 'cancelado') {
      return 'bg-red-100 text-red-700 border-red-300';
    }

    return 'bg-[#f5ede1] text-[#6b3f26] border-[#d8c4a8]';
  }

  obtenerDireccionCompleta(pedido: PedidoUsuario): string {
    const direccion = pedido.direcciones;

    if (!direccion) {
      return pedido.tipo_entrega === 'tienda'
        ? 'Recolección en tienda'
        : 'Sin dirección registrada';
    }

    const partes = [
      direccion.calle,
      direccion.numero,
      direccion.colonia,
      direccion.ciudad,
      direccion.estado,
      direccion.codigo_postal,
    ];

    return partes.filter(Boolean).join(', ');
  }

  puedeRastrear(pedido: PedidoUsuario): boolean {
    const envio = this.obtenerEnvio(pedido);

    return !!(
      envio?.numero_guia ||
      envio?.paqueterias?.nombre ||
      pedido.estado_envio === 'enviado' ||
      pedido.estado_envio === 'entregado'
    );
  }

  obtenerPaqueteria(pedido: PedidoUsuario): string {
    return (
      this.obtenerEnvio(pedido)?.paqueterias?.nombre ||
      this.obtenerEnvio(pedido)?.servicio ||
      'Pendiente de asignar'
    );
  }

  obtenerGuia(pedido: PedidoUsuario): string {
    return this.obtenerEnvio(pedido)?.numero_guia || 'Pendiente de asignar';
  }

  obtenerFechaEstimada(pedido: PedidoUsuario): string {
    const envio = this.obtenerEnvio(pedido);

    if (envio?.dias_estimados) {
      return `${envio.dias_estimados} día(s) hábil(es)`;
    }

    return 'Pendiente de confirmar';
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }
}
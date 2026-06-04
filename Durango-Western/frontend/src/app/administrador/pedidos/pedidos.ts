import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';


import { ApiService } from '../../core/services/api/api.service';

@Component({
  selector: 'app-pedidos',
  standalone: true,
imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe, FormsModule],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.css'
})
export class Pedidos implements OnInit {

  pedidos: any[] = [];
  loading = true;
  error = '';
  busqueda = '';

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.cargarPedidos();
  }

 cargarPedidos(): void {
  this.loading = true;
  this.error = '';

  this.api.get<any[]>('pedidos').subscribe({
    next: (data) => {
      this.pedidos = data ?? [];
      this.loading = false;

      this.cdr.detectChanges();
    },
    error: (error) => {
      console.error('Error cargando pedidos:', error);
      this.error = 'No se pudieron cargar los pedidos';
      this.loading = false;
    }
  });
}

  pedidosHoy(): number {
    const hoy = new Date().toDateString();

    return this.pedidos.filter(pedido =>
      new Date(pedido.created_at).toDateString() === hoy
    ).length;
  }

  pendientes(): number {
    return this.pedidos.filter(pedido =>
      pedido.estado === 'pendiente' ||
      pedido.estado === 'pago_pendiente'
    ).length;
  }

  pagados(): number {
    return this.pedidos.filter(pedido =>
      pedido.estado === 'pagado'
    ).length;
  }

  nombreCliente(pedido: any): string {
    if (pedido.direcciones?.nombre_recibe) {
      return pedido.direcciones.nombre_recibe;
    }

    if (pedido.notas) {
      return pedido.notas.replace('Cliente:', '').split(',')[0].trim();
    }

    return 'Cliente invitado';
  }

  totalProductos(pedido: any): number {
    return pedido.pedido_items?.reduce(
      (total: number, item: any) => total + Number(item.cantidad),
      0
    ) ?? 0;
  }

  claseEstado(estado: string): string {
    const clases: Record<string, string> = {
      pagado: 'bg-emerald-100 text-emerald-700',
      pendiente: 'bg-yellow-100 text-yellow-700',
      pago_pendiente: 'bg-yellow-100 text-yellow-700',
      pago_rechazado: 'bg-red-100 text-red-700',
      enviado: 'bg-blue-100 text-blue-700',
      completado: 'bg-purple-100 text-purple-700'
    };

    return clases[estado] ?? 'bg-gray-100 text-gray-700';
  }


  filtroActivo:
  | 'todos'
  | 'por_preparar'
  | 'pagados'
  | 'pendientes_pago' = 'todos';

  filtroEnvio:
  | 'todos'
  | 'pendiente'
  | 'preparando'
  | 'empacado'
  | 'enviado'
  | 'entregado'
  | 'cancelado' = 'todos';

cambiarFiltro(filtro: 'todos' | 'por_preparar' | 'pagados' | 'pendientes_pago'): void {
  this.filtroActivo = filtro;
}

pedidosFiltrados(): any[] {
  let lista = [...this.pedidos];

  const texto = this.busqueda.trim().toLowerCase();

  if (texto) {
    lista = lista.filter(pedido => {
      const folio = pedido.folio?.toLowerCase() ?? '';
      const notas = pedido.notas?.toLowerCase() ?? '';
      const cliente = pedido.direcciones?.nombre_recibe?.toLowerCase() ?? '';
      const telefono = pedido.direcciones?.telefono?.toLowerCase() ?? '';
      const correo = pedido.notas?.toLowerCase() ?? '';

      return (
        folio.includes(texto) ||
        notas.includes(texto) ||
        cliente.includes(texto) ||
        telefono.includes(texto) ||
        correo.includes(texto)
      );
    });
  }

  if (this.filtroEnvio !== 'todos') {
    lista = lista.filter(pedido =>
      (pedido.estado_envio ?? 'pendiente') === this.filtroEnvio
    );
  }

  if (this.filtroActivo === 'por_preparar') {
    lista = lista.filter(pedido =>
      pedido.estado === 'pagado' &&
      (pedido.estado_envio ?? 'pendiente') === 'pendiente'
    );
  }

  if (this.filtroActivo === 'pagados') {
    lista = lista.filter(pedido => pedido.estado === 'pagado');
  }

  if (this.filtroActivo === 'pendientes_pago') {
    lista = lista.filter(pedido =>
      pedido.estado === 'pendiente' ||
      pedido.estado === 'pago_pendiente'
    );
  }

  lista.sort((a, b) => {
    const prioridad: Record<string, number> = {
      pendiente: 1,
      preparando: 2,
      empacado: 3,
      enviado: 4,
      entregado: 5,
      cancelado: 6,
    };

    const aUrgente =
      a.estado === 'pagado' &&
      (a.estado_envio ?? 'pendiente') === 'pendiente';

    const bUrgente =
      b.estado === 'pagado' &&
      (b.estado_envio ?? 'pendiente') === 'pendiente';

    if (aUrgente && !bUrgente) return -1;
    if (!aUrgente && bUrgente) return 1;

    return (
      (prioridad[a.estado_envio ?? 'pendiente'] ?? 99) -
      (prioridad[b.estado_envio ?? 'pendiente'] ?? 99)
    );
  });

  return lista;
}

porPreparar(): number {
  return this.pedidos.filter(p =>
    p.estado === 'pagado' &&
    (p.estado_envio ?? 'pendiente') === 'pendiente'
  ).length;
}

claseEnvio(estado: string): string {
  const clases: Record<string, string> = {
    pendiente: 'bg-blue-100 text-blue-700',
    preparando: 'bg-yellow-100 text-yellow-700',
    empacado: 'bg-purple-100 text-purple-700',
    enviado: 'bg-indigo-100 text-indigo-700',
    entregado: 'bg-emerald-100 text-emerald-700',
    cancelado: 'bg-red-100 text-red-700',
  };

  return clases[estado] ?? 'bg-gray-100 text-gray-700';
}

preparando(): number {
  return this.pedidos.filter(p => p.estado_envio === 'preparando').length;
}

empacados(): number {
  return this.pedidos.filter(p => p.estado_envio === 'empacado').length;
}

enviados(): number {
  return this.pedidos.filter(p => p.estado_envio === 'enviado').length;
}

}
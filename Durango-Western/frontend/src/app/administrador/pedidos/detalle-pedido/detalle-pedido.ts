import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';


import { ApiService } from '../../../core/services/api/api.service';

@Component({
  selector: 'app-detalle-pedido',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe, FormsModule],
  templateUrl: './detalle-pedido.html',
  styleUrl: './detalle-pedido.css'
 
})
export class DetallePedido implements OnInit {

  pedido: any = null;
  loading = true;
  error = '';
  guardandoEstado = false;
  mensajeEstado = '';
  guardandoGuia = false;
  mensajeGuia = '';
  paqueteriaGuia = '';
  numeroGuia = '';

  estadosEnvio = [
  'pendiente',
  'preparando',
  'empacado',
  'enviado',
  'listo_recoger',
  'entregado',
  'cancelado'
];



  nuevoEstadoEnvio = '';

  esRecoleccionTienda(): boolean {
  const tipoEntrega = this.pedido?.tipo_entrega;
  const notas = String(this.pedido?.notas ?? '').toLowerCase();

  return tipoEntrega === 'tienda' || notas.includes('recolección en tienda') || notas.includes('recoleccion en tienda');
}

estadosDisponiblesEnvio(): string[] {
  if (this.esRecoleccionTienda()) {
    return [
      'pendiente',
      'preparando',
      'listo_recoger',
      'entregado',
      'cancelado',
    ];
  }

  return [
    'pendiente',
    'preparando',
    'empacado',
    'enviado',
    'entregado',
    'cancelado',
  ];
}

labelEstadoEnvio(estado: string): string {
  const labels: Record<string, string> = {
    pendiente: 'Pendiente',
    preparando: 'Preparando',
    empacado: 'Empacado',
    enviado: 'Enviado',
    listo_recoger: 'Listo para recoger',
    entregado: 'Entregado',
    cancelado: 'Cancelado',
  };

  return labels[estado] ?? estado;
}

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
  const id = this.route.snapshot.paramMap.get('id');

  console.log('ID PEDIDO:', id);

  if (!id) {
    this.error = 'Pedido no encontrado';
    this.loading = false;
    return;
  }

  this.api.get<any>(`pedidos/${id}`).subscribe({
    next: (data) => {
    console.log('PEDIDO DETALLE COMPLETO:', data);
    this.pedido = data;
    this.nuevoEstadoEnvio = data.estado_envio ?? 'pendiente';

    const envio = data.envios?.[0];

    this.numeroGuia = envio?.numero_guia ?? '';
    this.paqueteriaGuia = envio?.paqueterias?.nombre ?? '';

    this.loading = false;
    this.pedido = data;

  this.cdr.detectChanges();
},
    error: (err) => {
      console.error('ERROR DETALLE PEDIDO:', err);

      this.error = 'No se pudo cargar el pedido';
      this.loading = false;
    }
  });
}

  totalProductos(): number {
    return this.pedido?.pedido_items?.reduce(
      (total: number, item: any) => total + Number(item.cantidad),
      0
    ) ?? 0;
  }

  clasePago(estado: string): string {
  const clases: Record<string, string> = {
    pagado: 'bg-emerald-100 text-emerald-700',
    pendiente: 'bg-yellow-100 text-yellow-700',
    pago_pendiente: 'bg-yellow-100 text-yellow-700',
    pago_rechazado: 'bg-red-100 text-red-700',
  };

  return clases[estado] ?? 'bg-gray-100 text-gray-700';
}

claseEnvio(estado: string): string {
  const clases: Record<string, string> = {
  pendiente: 'bg-blue-100 text-blue-700',
  preparando: 'bg-yellow-100 text-yellow-700',
  empacado: 'bg-purple-100 text-purple-700',
  enviado: 'bg-indigo-100 text-indigo-700',
  listo_recoger: 'bg-amber-100 text-amber-700',
  entregado: 'bg-emerald-100 text-emerald-700',
  cancelado: 'bg-red-100 text-red-700',
};

  return clases[estado] ?? 'bg-gray-100 text-gray-700';
}

pagoPrincipal(): any {
  return this.pedido?.pagos?.[0] ?? null;
}

guardarEstadoEnvio(): void {
  if (!this.pedido) return;

  this.guardandoEstado = true;
  this.mensajeEstado = '';

  this.api.patch<any>(`pedidos/${this.pedido.id}/estado-envio`, {
    estado_envio: this.nuevoEstadoEnvio
  }).subscribe({
    next: (pedidoActualizado) => {
      this.pedido = pedidoActualizado;
      this.nuevoEstadoEnvio = pedidoActualizado.estado_envio ?? 'pendiente';
      this.mensajeEstado = 'Estado de envío actualizado correctamente';
      this.guardandoEstado = false;
      this.cdr.detectChanges();
    },
    error: (error) => {
  console.error('Error actualizando estado de envío:', error);

  this.mensajeEstado =
    error?.error?.message ||
    'Debes guardar la paquetería y el número de guía antes de marcar como enviado';

  this.guardandoEstado = false;
  this.cdr.detectChanges();
}
  });
}

pasosTimeline(): { key: string; label: string }[] {
  if (this.esRecoleccionTienda()) {
    return [
      { key: 'recibido', label: 'Pedido recibido' },
      { key: 'pagado', label: 'Pago aprobado' },
      { key: 'preparando', label: 'Preparando' },
      { key: 'listo_recoger', label: 'Listo para recoger' },
      { key: 'entregado', label: 'Entregado' },
    ];
  }

  return [
    { key: 'recibido', label: 'Pedido recibido' },
    { key: 'pagado', label: 'Pago aprobado' },
    { key: 'preparando', label: 'Preparando' },
    { key: 'empacado', label: 'Empacado' },
    { key: 'enviado', label: 'Enviado' },
    { key: 'entregado', label: 'Entregado' },
  ];
}

guardarGuiaEnvio(): void {
  const envio = this.pedido?.envios?.[0];

  if (!envio?.id) {
    this.mensajeGuia = 'Este pedido no tiene envío registrado';
    return;
  }

  if (!envio.paqueterias?.nombre && !this.paqueteriaGuia.trim()) {
    this.mensajeGuia = 'Selecciona la paquetería';
    return;
  }

  if (!this.numeroGuia.trim()) {
    this.mensajeGuia = 'Captura el número de guía';
    return;
  }

  this.guardandoGuia = true;
  this.mensajeGuia = '';
  this.cdr.detectChanges();

  this.api.patch<any>(`envios/${envio.id}/guia`, {
    numero_guia: this.numeroGuia.trim(),
    paqueteria_nombre: this.paqueteriaGuia.trim() || undefined,
  }).subscribe({
    next: (envioActualizado) => {
      const envioAnterior = this.pedido.envios[0];

      this.pedido.envios[0] = {
        ...envioAnterior,
        ...envioActualizado,
        paqueterias:
          envioActualizado.paqueterias ??
          envioAnterior.paqueterias,
      };

      this.numeroGuia =
        envioActualizado.numero_guia ?? this.numeroGuia;

      this.paqueteriaGuia =
        envioActualizado.paqueterias?.nombre ??
        this.paqueteriaGuia;

      this.mensajeGuia = 'Guía guardada correctamente';
      this.guardandoGuia = false;
      this.cdr.detectChanges();
    },
    error: (error) => {
      console.error('Error guardando guía:', error);

      this.mensajeGuia =
        error?.error?.message ||
        'No se pudo guardar la guía';

      this.guardandoGuia = false;
      this.cdr.detectChanges();
    }
  });
}

indiceActualTimeline(): number {
  if (!this.pedido) return 0;

  if (this.pedido.estado !== 'pagado') {
    return 0;
  }

  const estadoEnvio = this.pedido.estado_envio ?? 'pendiente';

  if (this.esRecoleccionTienda()) {
    const mapaTienda: Record<string, number> = {
      pendiente: 1,
      preparando: 2,
      listo_recoger: 3,
      entregado: 4,
    };

    return mapaTienda[estadoEnvio] ?? 1;
  }

  const mapaDomicilio: Record<string, number> = {
    pendiente: 1,
    preparando: 2,
    empacado: 3,
    enviado: 4,
    entregado: 5,
  };

  return mapaDomicilio[estadoEnvio] ?? 1;
}

clasePasoTimeline(index: number): string {
  const actual = this.indiceActualTimeline();

  if (index < actual) {
    return 'bg-emerald-600 text-white border-emerald-600';
  }

  if (index === actual) {
    return 'bg-[#9b6235] text-white border-[#9b6235]';
  }

  return 'bg-white text-[#8a542f] border-[#d8c5aa]';
}

claseLineaTimeline(index: number): string {
  const actual = this.indiceActualTimeline();

  if (index < actual) {
    return 'bg-emerald-600';
  }

  return 'bg-[#d8c5aa]';
}

cambiarEstadoRapido(estado: string): void {
  this.nuevoEstadoEnvio = estado;
  this.guardarEstadoEnvio();
}

puedeCambiarEstado(estado: string): boolean {
  return this.pedido?.estado_envio !== estado;
}


}
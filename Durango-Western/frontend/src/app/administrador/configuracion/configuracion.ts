import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api/api.service';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.css'
})
export class Configuracion implements OnInit {

  private cdr = inject(ChangeDetectorRef);

  loading = true;
  guardando = false;

  mensaje = '';
  error = '';

  config: any = {};

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.cargarConfiguracion();
    });
  }

  cargarConfiguracion(): void {
    this.loading = true;
    this.error = '';
    this.mensaje = '';

    this.api.get<any>('configuraciones').subscribe({
      next: (config) => {

        console.log('CONFIG API:', config);

        this.config = {
          nombreTienda: config?.nombre_tienda ?? 'Durango Western',
          correo: config?.correo_contacto ?? '',
          telefono: config?.telefono ?? '',
          direccion: config?.direccion ?? '',
          envioGratisDesde: Number(config?.envio_gratis_desde ?? 4000),
          estadoTienda: config?.estado_tienda ?? 'Activa',
          comprasInvitado: config?.compras_invitado ?? true,
          mostrarAgotados: config?.mostrar_productos_agotados ?? false,
          carritoPersistente: config?.carrito_persistente ?? true,

          adminNombre: 'Marco Antonio',
          adminCorreo: 'admin@durangowestern.com',
          rol: 'Administrador principal',
          ultimoAcceso: 'Hoy'
        };

        this.loading = false;
        this.cdr.detectChanges();
      },

      error: (error) => {
        console.error('Error cargando configuración:', error);

        this.loading = false;
        this.error = 'No se pudo cargar la configuración';
        this.cdr.detectChanges();
      }
    });
  }

  guardarConfiguracion(): void {
  this.error = '';
  this.mensaje = '';

  if (Number(this.config.envioGratisDesde) < 0) {
    this.error = 'El monto de envío gratis no puede ser menor a 0';
    this.cdr.detectChanges();
    return;
  }

  this.guardando = true;
  this.loading = false;
  this.cdr.detectChanges();

  this.api.patch<any>('configuraciones', this.config).subscribe({
    next: () => {
      this.guardando = false;
      this.loading = false;
      this.mostrarMensaje('Configuración guardada correctamente');
      this.cdr.detectChanges();
    },
    error: (error) => {
      console.error('Error guardando configuración:', error);

      this.guardando = false;
      this.loading = false;
      this.error =
        error?.error?.message ||
        'No se pudo guardar la configuración';

      this.cdr.detectChanges();
    }
  });
}

  private mostrarMensaje(texto: string): void {
    this.error = '';
    this.mensaje = texto;
    this.cdr.detectChanges();

    setTimeout(() => {
      this.mensaje = '';
      this.cdr.detectChanges();
    }, 2500);
  }
}
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { environment } from '../../../environments/environment';

import {
  AuthService,
  UsuarioSesion,
} from '../../core/services/auth/auth.service';

export interface DireccionUsuario {
  id: string;
  usuario_id: string;
  nombre_recibe: string;
  telefono?: string | null;
  calle: string;
  numero?: string | null;
  colonia?: string | null;
  ciudad: string;
  estado: string;
  codigo_postal: string;
  referencias?: string | null;
  principal: boolean;
  created_at?: string;
  updated_at?: string;
}

interface DireccionForm {
  nombre_recibe: string;
  telefono: string;
  calle: string;
  numero: string;
  colonia: string;
  ciudad: string;
  estado: string;
  codigo_postal: string;
  referencias: string;
  principal: boolean;
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil implements OnInit {
  usuario: UsuarioSesion | null = null;
  direcciones: DireccionUsuario[] = [];

  editandoPerfil = false;
  cargando = false;
  guardando = false;
  cargandoDirecciones = false;

  mostrarFormularioDireccion = false;
  guardandoDireccion = false;
  direccionEditandoId: string | null = null;

  nombreEdit = '';
  telefonoEdit = '';

  mensaje = '';
  error = '';

  direccionForm: DireccionForm = this.obtenerFormularioDireccionVacio();

  erroresDireccion: Partial<Record<keyof DireccionForm, string>> = {};

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.cargarUsuarioDesdeBackend();
    this.cargarDirecciones();
  }

  cargarUsuarioDesdeBackend(): void {
    this.error = '';
    this.mensaje = '';
    this.cargando = true;

    const token = this.authService.getToken();

    if (!token) {
      this.authService.logout();
      this.router.navigate(['/login']);
      return;
    }

    this.authService.obtenerMiPerfil().subscribe({
      next: (usuarioBackend) => {
        const usuarioFinal: UsuarioSesion = {
          id: usuarioBackend.id,
          nombre: usuarioBackend.nombre || '',
          email: usuarioBackend.email || '',
          rol: usuarioBackend.rol || 'cliente',
          telefono: usuarioBackend.telefono || null,
          avatar_url: usuarioBackend.avatar_url || null,
          loggedIn: true,
          loginAt:
            this.authService.getUser()?.loginAt || new Date().toISOString(),
          token,
        };

        this.usuario = usuarioFinal;
        this.nombreEdit = usuarioFinal.nombre;
        this.telefonoEdit = usuarioFinal.telefono || '';

        this.authService.updateUser(usuarioFinal);

        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.cargando = false;

        if (error.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login']);
          return;
        }

        this.error =
          'No se pudo cargar la información del perfil desde el servidor.';
        this.cdr.detectChanges();
      },
    });
  }

  cargarDirecciones(): void {
    const token = this.authService.getToken();

    if (!token) {
      return;
    }

    this.cargandoDirecciones = true;

    this.http
      .get<DireccionUsuario[]>(`${environment.apiUrl}/direcciones`, {
        headers: this.getAuthHeaders(),
      })
      .subscribe({
        next: (direcciones) => {
          this.direcciones = direcciones || [];
          this.cargandoDirecciones = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.cargandoDirecciones = false;

          if (error.status === 401) {
            this.authService.logout();
            this.router.navigate(['/login']);
            return;
          }

          this.error = 'No se pudieron cargar tus direcciones.';
          this.cdr.detectChanges();
        },
      });
  }

  activarEdicion(): void {
    this.error = '';
    this.mensaje = '';
    this.guardando = false;
    this.editandoPerfil = true;

    this.nombreEdit = this.usuario?.nombre || '';
    this.telefonoEdit = this.usuario?.telefono || '';

    this.cdr.detectChanges();
  }

  cancelarEdicion(): void {
    this.editandoPerfil = false;
    this.guardando = false;
    this.error = '';
    this.mensaje = '';

    this.nombreEdit = this.usuario?.nombre || '';
    this.telefonoEdit = this.usuario?.telefono || '';

    this.cdr.detectChanges();
  }

  guardarPerfil(): void {
    this.error = '';
    this.mensaje = '';

    if (!this.nombreEdit.trim()) {
      this.error = 'El nombre no puede estar vacío.';
      return;
    }

    this.guardando = true;

    this.authService
      .actualizarPerfil({
        nombre: this.nombreEdit.trim(),
        telefono: this.telefonoEdit.trim() || null,
      })
      .subscribe({
        next: (usuarioActualizado) => {
          const token = this.authService.getToken();

          if (!token) {
            this.authService.logout();
            this.router.navigate(['/login']);
            return;
          }

          const usuarioFinal: UsuarioSesion = {
            id: usuarioActualizado.id,
            nombre: usuarioActualizado.nombre || '',
            email: usuarioActualizado.email || '',
            rol: usuarioActualizado.rol || 'cliente',
            telefono: usuarioActualizado.telefono || null,
            avatar_url: usuarioActualizado.avatar_url || null,
            loggedIn: true,
            loginAt: this.usuario?.loginAt || new Date().toISOString(),
            token,
          };

          this.usuario = usuarioFinal;
          this.nombreEdit = usuarioFinal.nombre;
          this.telefonoEdit = usuarioFinal.telefono || '';

          this.authService.updateUser(usuarioFinal);

          this.guardando = false;
          this.editandoPerfil = false;
          this.mensaje = 'Perfil actualizado correctamente.';

          this.cdr.detectChanges();
        },
        error: (error) => {
          this.guardando = false;

          if (error.status === 401) {
            this.authService.logout();
            this.router.navigate(['/login']);
            return;
          }

          if (error.status === 0) {
            this.error = 'No se pudo conectar con el servidor.';
            this.cdr.detectChanges();
            return;
          }

          this.error = 'No se pudo actualizar el perfil. Intenta nuevamente.';
          this.cdr.detectChanges();
        },
      });
  }

  agregarDireccion(): void {
    this.error = '';
    this.mensaje = '';
    this.erroresDireccion = {};
    this.direccionEditandoId = null;
    this.direccionForm = this.obtenerFormularioDireccionVacio();

    if (this.usuario?.nombre) {
      this.direccionForm.nombre_recibe = this.usuario.nombre;
    }

    if (this.usuario?.telefono) {
      this.direccionForm.telefono = this.usuario.telefono;
    }

    if (this.direcciones.length === 0) {
      this.direccionForm.principal = true;
    }

    this.mostrarFormularioDireccion = true;
    this.cdr.detectChanges();
  }

  editarDireccion(direccion: DireccionUsuario): void {
    this.error = '';
    this.mensaje = '';
    this.erroresDireccion = {};

    this.direccionEditandoId = direccion.id;

    this.direccionForm = {
      nombre_recibe: direccion.nombre_recibe || '',
      telefono: direccion.telefono || '',
      calle: direccion.calle || '',
      numero: direccion.numero || '',
      colonia: direccion.colonia || '',
      ciudad: direccion.ciudad || 'Durango',
      estado: direccion.estado || 'Durango',
      codigo_postal: direccion.codigo_postal || '',
      referencias: direccion.referencias || '',
      principal: direccion.principal || false,
    };

    this.mostrarFormularioDireccion = true;
    this.cdr.detectChanges();
  }

  cancelarAgregarDireccion(): void {
    this.mostrarFormularioDireccion = false;
    this.guardandoDireccion = false;
    this.direccionEditandoId = null;
    this.erroresDireccion = {};
    this.direccionForm = this.obtenerFormularioDireccionVacio();
    this.cdr.detectChanges();
  }

  guardarDireccion(): void {
    this.error = '';
    this.mensaje = '';
    this.erroresDireccion = {};

    const formularioValido = this.validarFormularioDireccion();

    if (!formularioValido) {
      this.error = 'Revisa los campos marcados antes de guardar la dirección.';
      this.cdr.detectChanges();
      return;
    }

    const token = this.authService.getToken();

    if (!token) {
      this.authService.logout();
      this.router.navigate(['/login']);
      return;
    }

    this.guardandoDireccion = true;

    const esEdicion = !!this.direccionEditandoId;
    const direccionId = this.direccionEditandoId;

    const telefonoLimpio = this.limpiarTelefono(this.direccionForm.telefono);

    const payload = {
      nombre_recibe: this.direccionForm.nombre_recibe.trim(),
      telefono: telefonoLimpio || undefined,
      calle: this.direccionForm.calle.trim(),
      numero: this.direccionForm.numero.trim() || undefined,
      colonia: this.direccionForm.colonia.trim() || undefined,
      ciudad: this.direccionForm.ciudad.trim(),
      estado: this.direccionForm.estado.trim(),
      codigo_postal: this.direccionForm.codigo_postal.trim(),
      referencias: this.direccionForm.referencias.trim() || undefined,
      principal: this.direccionForm.principal,
    };

    const request$ =
      esEdicion && direccionId
        ? this.http.put<DireccionUsuario>(
            `${environment.apiUrl}/direcciones/${direccionId}`,
            payload,
            {
              headers: this.getAuthHeaders(),
            }
          )
        : this.http.post<DireccionUsuario>(
            `${environment.apiUrl}/direcciones`,
            payload,
            {
              headers: this.getAuthHeaders(),
            }
          );

    request$.subscribe({
      next: () => {
        this.guardandoDireccion = false;
        this.mostrarFormularioDireccion = false;
        this.direccionEditandoId = null;
        this.direccionForm = this.obtenerFormularioDireccionVacio();
        this.erroresDireccion = {};

        this.mensaje = esEdicion
          ? 'Dirección actualizada correctamente.'
          : 'Dirección agregada correctamente.';

        this.cargarDirecciones();
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.guardandoDireccion = false;

        if (error.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login']);
          return;
        }

        if (error.status === 400) {
          this.error = 'La dirección contiene datos inválidos. Revisa los campos.';
          this.cdr.detectChanges();
          return;
        }

        if (error.status === 0) {
          this.error = 'No se pudo conectar con el servidor.';
          this.cdr.detectChanges();
          return;
        }

        this.error = 'No se pudo guardar la dirección. Intenta nuevamente.';
        this.cdr.detectChanges();
      },
    });
  }

  validarFormularioDireccion(): boolean {
    const errores: Partial<Record<keyof DireccionForm, string>> = {};

    const nombre = this.direccionForm.nombre_recibe.trim();
    const telefono = this.limpiarTelefono(this.direccionForm.telefono);
    const calle = this.direccionForm.calle.trim();
    const numero = this.direccionForm.numero.trim();
    const colonia = this.direccionForm.colonia.trim();
    const ciudad = this.direccionForm.ciudad.trim();
    const estado = this.direccionForm.estado.trim();
    const codigoPostal = this.direccionForm.codigo_postal.trim();
    const referencias = this.direccionForm.referencias.trim();

    if (!nombre) {
      errores.nombre_recibe = 'Ingresa el nombre de quien recibe.';
    } else if (nombre.length < 3) {
      errores.nombre_recibe = 'El nombre debe tener al menos 3 caracteres.';
    } else if (nombre.length > 120) {
      errores.nombre_recibe = 'El nombre no puede superar 120 caracteres.';
    }

    if (telefono && telefono.length !== 10) {
      errores.telefono = 'El teléfono debe tener 10 dígitos.';
    }

    if (!calle) {
      errores.calle = 'Ingresa la calle.';
    } else if (calle.length < 3) {
      errores.calle = 'La calle debe tener al menos 3 caracteres.';
    } else if (calle.length > 150) {
      errores.calle = 'La calle no puede superar 150 caracteres.';
    }

    if (numero.length > 20) {
      errores.numero = 'El número no puede superar 20 caracteres.';
    }

    if (colonia.length > 100) {
      errores.colonia = 'La colonia no puede superar 100 caracteres.';
    }

    if (!ciudad) {
      errores.ciudad = 'Ingresa la ciudad.';
    } else if (ciudad.length < 2) {
      errores.ciudad = 'La ciudad debe tener al menos 2 caracteres.';
    } else if (ciudad.length > 100) {
      errores.ciudad = 'La ciudad no puede superar 100 caracteres.';
    }

    if (!estado) {
      errores.estado = 'Ingresa el estado.';
    } else if (estado.length < 2) {
      errores.estado = 'El estado debe tener al menos 2 caracteres.';
    } else if (estado.length > 100) {
      errores.estado = 'El estado no puede superar 100 caracteres.';
    }

    if (!codigoPostal) {
      errores.codigo_postal = 'Ingresa el código postal.';
    } else if (!/^\d{5}$/.test(codigoPostal)) {
      errores.codigo_postal = 'El código postal debe tener 5 dígitos.';
    }

    if (referencias.length > 250) {
      errores.referencias = 'Las referencias no pueden superar 250 caracteres.';
    }

    this.erroresDireccion = errores;

    return Object.keys(errores).length === 0;
  }

  marcarDireccionPrincipal(direccion: DireccionUsuario): void {
    const token = this.authService.getToken();

    if (!token) {
      this.authService.logout();
      this.router.navigate(['/login']);
      return;
    }

    this.http
      .put<DireccionUsuario>(
        `${environment.apiUrl}/direcciones/${direccion.id}`,
        {
          principal: true,
        },
        {
          headers: this.getAuthHeaders(),
        }
      )
      .subscribe({
        next: () => {
          this.mensaje = 'Dirección principal actualizada.';
          this.cargarDirecciones();
        },
        error: (error) => {
          if (error.status === 401) {
            this.authService.logout();
            this.router.navigate(['/login']);
            return;
          }

          this.error = 'No se pudo marcar la dirección como principal.';
          this.cdr.detectChanges();
        },
      });
  }

  eliminarDireccion(direccion: DireccionUsuario): void {
    const confirmar = confirm('¿Seguro que deseas eliminar esta dirección?');

    if (!confirmar) {
      return;
    }

    const token = this.authService.getToken();

    if (!token) {
      this.authService.logout();
      this.router.navigate(['/login']);
      return;
    }

    this.http
      .delete<{ message: string }>(
        `${environment.apiUrl}/direcciones/${direccion.id}`,
        {
          headers: this.getAuthHeaders(),
        }
      )
      .subscribe({
        next: () => {
          this.mensaje = 'Dirección eliminada correctamente.';
          this.cargarDirecciones();
        },
        error: (error) => {
          if (error.status === 401) {
            this.authService.logout();
            this.router.navigate(['/login']);
            return;
          }

          this.error = 'No se pudo eliminar la dirección.';
          this.cdr.detectChanges();
        },
      });
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  irAPedidos(): void {
    this.router.navigate(['/pedidos']);
  }

  irAMetodosPago(): void {
    this.mensaje = 'La sección de métodos de pago se agregará más adelante.';
  }

  obtenerInicial(): string {
    const nombre = this.usuario?.nombre || this.usuario?.email || 'U';
    return nombre.charAt(0).toUpperCase();
  }

  obtenerDireccionCompleta(direccion: DireccionUsuario): string {
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

  private obtenerFormularioDireccionVacio(): DireccionForm {
    return {
      nombre_recibe: '',
      telefono: '',
      calle: '',
      numero: '',
      colonia: '',
      ciudad: 'Durango',
      estado: 'Durango',
      codigo_postal: '',
      referencias: '',
      principal: false,
    };
  }

  private limpiarTelefono(telefono: string): string {
    return telefono.replace(/\D/g, '');
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }
}
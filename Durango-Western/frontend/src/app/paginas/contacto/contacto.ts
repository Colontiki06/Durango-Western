import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { environment } from '../../../environments/environment';

interface ContactoResponse {
  enviado: boolean;
  messageId?: string | null;
  motivo?: string;
}

@Component({
  selector: 'app-contacto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contacto.html',
  styleUrl: './contacto.css',
})
export class Contacto {
  nombre = '';
  correo = '';
  asunto = '';
  mensajeFormulario = '';

  empresa = '';

  cargando = false;
  error = '';
  mostrarModalExito = false;

  readonly maxNombre = 100;
  readonly maxCorreo = 120;
  readonly maxMensaje = 1000;

  readonly asuntosPermitidos = [
    'Duda sobre producto',
    'Estado de mi pedido',
    'Envíos',
    'Cambios o devoluciones',
    'Disponibilidad en tienda',
    'Facturación',
    'Otro',
  ];

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  enviarMensaje(): void {
    if (this.cargando) {
      return;
    }

    this.error = '';
    this.mostrarModalExito = false;

    const nombre = this.nombre.trim();
    const correo = this.correo.trim().toLowerCase();
    const asunto = this.asunto.trim();
    const mensaje = this.mensajeFormulario.trim();

    if (!nombre) {
      this.mostrarError('Ingresa tu nombre.');
      return;
    }

    if (nombre.length < 2) {
      this.mostrarError('El nombre debe tener al menos 2 caracteres.');
      return;
    }

    if (nombre.length > this.maxNombre) {
      this.mostrarError(`El nombre no debe exceder ${this.maxNombre} caracteres.`);
      return;
    }

    if (!correo) {
      this.mostrarError('Ingresa tu correo electrónico.');
      return;
    }

    if (correo.length > this.maxCorreo) {
      this.mostrarError(`El correo no debe exceder ${this.maxCorreo} caracteres.`);
      return;
    }

    if (!this.emailValido(correo)) {
      this.mostrarError('Ingresa un correo electrónico válido.');
      return;
    }

    if (!asunto) {
      this.mostrarError('Selecciona un asunto.');
      return;
    }

    if (!this.asuntosPermitidos.includes(asunto)) {
      this.mostrarError('Selecciona un asunto válido.');
      return;
    }

    if (!mensaje) {
      this.mostrarError('Ingresa tu mensaje.');
      return;
    }

    if (mensaje.length < 10) {
      this.mostrarError('El mensaje debe tener al menos 10 caracteres.');
      return;
    }

    if (mensaje.length > this.maxMensaje) {
      this.mostrarError(`El mensaje no debe exceder ${this.maxMensaje} caracteres.`);
      return;
    }

    this.cargando = true;
    this.cdr.detectChanges();

    this.http
      .post<ContactoResponse>(`${environment.apiUrl}/correos/contacto`, {
        nombre,
        correo,
        asunto,
        mensaje,
        empresa: this.empresa,
      })
      .pipe(
        finalize(() => {
          this.cargando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          if (!response?.enviado) {
            this.mostrarError(
              'No se pudo confirmar el envío del mensaje. Intenta nuevamente.',
            );
            return;
          }

          this.limpiarFormulario();
          this.mostrarModalExito = true;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error enviando mensaje de contacto:', error);

          const mensajeError =
            error?.error?.message ||
            error?.error?.motivo ||
            'No se pudo enviar el mensaje. Revisa tu conexión e intenta nuevamente.';

          this.mostrarError(
            Array.isArray(mensajeError) ? mensajeError[0] : mensajeError,
          );
        },
      });
  }

  cerrarModalExito(): void {
    this.mostrarModalExito = false;
    this.cdr.detectChanges();
  }

  limpiarFormulario(): void {
    this.nombre = '';
    this.correo = '';
    this.asunto = '';
    this.mensajeFormulario = '';
    this.empresa = '';
  }

  limpiarAlertas(): void {
    this.error = '';
    this.cdr.detectChanges();
  }

  caracteresRestantesMensaje(): number {
    return this.maxMensaje - this.mensajeFormulario.length;
  }

  private mostrarError(mensaje: string): void {
    this.error = mensaje;
    this.cdr.detectChanges();
  }

  private emailValido(email: string): boolean {
    if (!email) {
      return false;
    }

    const emailRegex =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(email)) {
      return false;
    }

    if (email.includes('..')) {
      return false;
    }

    const [localPart, domain] = email.split('@');

    if (!localPart || !domain) {
      return false;
    }

    if (localPart.length > 64) {
      return false;
    }

    if (domain.length > 253) {
      return false;
    }

    return true;
  }
}
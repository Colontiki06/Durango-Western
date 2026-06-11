import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../core/services/auth/auth.service';

@Component({
  selector: 'app-recuperar-contrasena',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './recuperar-contrasena.html',
  styleUrl: './recuperar-contrasena.css',
})
export class RecuperarContrasena {
  email = '';

  cargando = signal(false);
  mensajeExito = signal('');
  error = signal('');

  constructor(private authService: AuthService) {}

  limpiarAlertas(): void {
    this.error.set('');
    this.mensajeExito.set('');
  }

  correoValido(correo: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (!regex.test(correo)) {
      return false;
    }

    if (correo.includes('..')) {
      return false;
    }

    const partes = correo.split('@');

    if (partes.length !== 2) {
      return false;
    }

    const [usuario, dominio] = partes;

    if (!usuario || !dominio) {
      return false;
    }

    if (usuario.length > 64 || dominio.length > 253) {
      return false;
    }

    if (dominio.startsWith('.') || dominio.endsWith('.')) {
      return false;
    }

    return true;
  }

  enviarEnlace(): void {
    this.error.set('');
    this.mensajeExito.set('');

    const correo = this.email.trim().toLowerCase();

    if (!correo) {
      this.error.set('Ingresa tu correo electrónico.');
      return;
    }

    if (!this.correoValido(correo)) {
      this.error.set('Ingresa un correo electrónico válido.');
      return;
    }

    this.cargando.set(true);

    this.authService
      .forgotPassword(correo)
      .pipe(
        finalize(() => {
          this.cargando.set(false);
        })
      )
      .subscribe({
        next: () => {
          this.error.set('');
          this.mensajeExito.set(
            'Si el correo está registrado, recibirás instrucciones para cambiar tu contraseña. Revisa tu bandeja de entrada o la carpeta de spam.'
          );
        },
        error: (err) => {
          this.mensajeExito.set('');
          this.error.set(
            err?.error?.message ||
              'No se pudo enviar el correo de recuperación. Intenta nuevamente.'
          );
        },
      });
  }
}
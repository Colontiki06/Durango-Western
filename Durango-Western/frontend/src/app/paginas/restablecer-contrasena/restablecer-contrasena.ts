import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth/auth.service';

@Component({
  selector: 'app-restablecer-contrasena',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './restablecer-contrasena.html',
  styleUrl: './restablecer-contrasena.css'
})
export class RestablecerContrasena implements OnInit {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  token = '';

  nuevaPassword = '';
  confirmarPassword = '';

  cargando = false;
  exito = false;
  error = '';

  mostrarPassword = false;
  mostrarConfirmarPassword = false;

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';

    if (!this.token) {
      this.error = 'El enlace de recuperación no es válido o está incompleto.';
    }
  }

  limpiarAlertas(): void {
    this.error = '';
  }

  passwordMuyCorta(): boolean {
    return this.nuevaPassword.length > 0 && this.nuevaPassword.length < 8;
  }

  passwordsNoCoinciden(): boolean {
    return (
      this.nuevaPassword.length > 0 &&
      this.confirmarPassword.length > 0 &&
      this.nuevaPassword !== this.confirmarPassword
    );
  }

  formularioInvalido(): boolean {
    return (
      this.cargando ||
      !this.token ||
      !this.nuevaPassword.trim() ||
      !this.confirmarPassword.trim() ||
      this.nuevaPassword.length < 8 ||
      this.nuevaPassword !== this.confirmarPassword
    );
  }

  restablecerPassword(): void {
    this.error = '';
    this.exito = false;

    if (!this.token) {
      this.error = 'El enlace de recuperación no es válido.';
      return;
    }

    if (!this.nuevaPassword.trim()) {
      this.error = 'Ingresa tu nueva contraseña.';
      return;
    }

    if (this.nuevaPassword.length < 8) {
      this.error = 'La contraseña debe tener al menos 8 caracteres.';
      return;
    }

    if (!this.confirmarPassword.trim()) {
      this.error = 'Confirma tu nueva contraseña.';
      return;
    }

    if (this.nuevaPassword !== this.confirmarPassword) {
      this.error = 'Las contraseñas no coinciden.';
      return;
    }

    this.cargando = true;

    this.authService.resetPassword(this.token, this.nuevaPassword).subscribe({
      next: () => {
        this.cargando = false;
        this.exito = true;
        this.error = '';
        this.nuevaPassword = '';
        this.confirmarPassword = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargando = false;
        this.exito = false;
        this.error =
          err?.error?.message ||
          'No se pudo restablecer la contraseña. El enlace puede haber expirado.';

        this.cdr.detectChanges();
      }
    });
  }
}
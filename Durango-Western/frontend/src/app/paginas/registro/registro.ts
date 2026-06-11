import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../core/services/auth/auth.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './registro.html',
  styleUrl: './registro.css',
})
export class Registro {
  fullName = '';
  email = '';
  password = '';
  confirmPassword = '';

  error = '';
  loading = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  register(): void {
    this.error = '';

    if (!this.fullName.trim()) {
      this.error = 'Ingresa tu nombre completo.';
      return;
    }

    if (!this.email.trim()) {
      this.error = 'Ingresa tu correo electrónico.';
      return;
    }

    if (!this.password.trim()) {
      this.error = 'Ingresa una contraseña.';
      return;
    }

    if (this.password.length < 8) {
      this.error = 'La contraseña debe tener mínimo 8 caracteres.';
      return;
    }

    if (!this.confirmPassword.trim()) {
      this.error = 'Confirma tu contraseña.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Las contraseñas no coinciden.';
      return;
    }

    this.loading = true;

    this.authService
      .register(this.fullName, this.email, this.password)
      .subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/perfil']);
        },
        error: (error) => {
          this.loading = false;

          if (error.status === 400) {
            this.error =
              error.error?.message || 'Revisa los datos ingresados.';
            return;
          }

          if (error.status === 0) {
            this.error = 'No se pudo conectar con el servidor.';
            return;
          }

          this.error = 'No se pudo crear la cuenta. Intenta nuevamente.';
        },
      });
  }
}
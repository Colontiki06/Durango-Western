import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../core/services/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email = '';
  password = '';

  emailRecuperacion = '';

  error = '';
  mensaje = '';
  loading = false;
  enviandoRecuperacion = false;

  modoRecuperacion = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  login(): void {
    this.error = '';
    this.mensaje = '';

    if (!this.email.trim()) {
      this.error = 'Ingresa tu correo electrónico.';
      return;
    }

    if (!this.password.trim()) {
      this.error = 'Ingresa tu contraseña.';
      return;
    }

    this.loading = true;

    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.loading = false;

        const redirect = this.route.snapshot.queryParamMap.get('redirect');

        if (redirect) {
          this.router.navigateByUrl(redirect);
          return;
        }

        this.router.navigate(['/perfil']);
      },
      error: (error) => {
        this.loading = false;

        if (error.status === 401) {
          this.error = 'Correo o contraseña incorrectos.';
          return;
        }

        if (error.status === 400) {
          this.error = 'Revisa los datos ingresados.';
          return;
        }

        if (error.status === 0) {
          this.error = 'No se pudo conectar con el servidor.';
          return;
        }

        this.error = 'No se pudo iniciar sesión. Intenta nuevamente.';
      },
    });
  }

  abrirRecuperacion(): void {
    this.error = '';
    this.mensaje = '';
    this.modoRecuperacion = true;
    this.emailRecuperacion = this.email.trim().toLowerCase();
  }

  cancelarRecuperacion(): void {
    this.error = '';
    this.mensaje = '';
    this.modoRecuperacion = false;
    this.enviandoRecuperacion = false;
  }

  enviarCorreoRecuperacion(): void {
    this.error = '';
    this.mensaje = '';

    if (!this.emailRecuperacion.trim()) {
      this.error = 'Ingresa el correo de tu cuenta.';
      return;
    }

    if (!this.emailValido(this.emailRecuperacion)) {
      this.error = 'Ingresa un correo válido.';
      return;
    }

    this.enviandoRecuperacion = true;

    this.authService.forgotPassword(this.emailRecuperacion).subscribe({
      next: (response) => {
        this.enviandoRecuperacion = false;
        this.mensaje =
          response.message ||
          'Si el correo está registrado, recibirás instrucciones para cambiar tu contraseña.';
      },
      error: (error) => {
        this.enviandoRecuperacion = false;

        if (error.status === 0) {
          this.error = 'No se pudo conectar con el servidor.';
          return;
        }

        this.error =
          error?.error?.message ||
          'No se pudo enviar el correo de recuperación. Intenta nuevamente.';
      },
    });
  }

  private emailValido(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
  }
}
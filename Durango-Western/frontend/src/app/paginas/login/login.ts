import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';

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
  mostrarPassword = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  login(): void {
    if (this.loading) return;

    this.error = '';
    this.mensaje = '';

    const correo = this.email.trim().toLowerCase();
    const password = this.password.trim();

    if (!correo) {
      this.error = 'Ingresa tu correo electrónico.';
      this.actualizarVista();
      return;
    }

    if (!this.emailValido(correo)) {
      this.error = 'Ingresa un correo electrónico válido.';
      this.actualizarVista();
      return;
    }

    if (!password) {
      this.error = 'Ingresa tu contraseña.';
      this.actualizarVista();
      return;
    }

    this.email = correo;
    this.loading = true;
    this.actualizarVista();

    this.authService
      .login(correo, password)
      .pipe(
        timeout(10000),
        finalize(() => {
          this.loading = false;
          this.actualizarVista();
        })
      )
      .subscribe({
        next: () => {
          const redirect = this.route.snapshot.queryParamMap.get('redirect');

          if (redirect) {
            this.router.navigateByUrl(redirect);
            return;
          }

          this.router.navigate(['/perfil']);
        },

        error: (error) => {
          console.error('Error login:', error);

          if (error?.status === 401) {
            this.error = 'Correo o contraseña incorrectos.';
            this.actualizarVista();
            return;
          }

          if (error?.status === 400) {
            this.error = 'El correo o la contraseña no tienen un formato válido.';
            this.actualizarVista();
            return;
          }

          if (error?.status === 404) {
            this.error = 'No existe una cuenta registrada con este correo.';
            this.actualizarVista();
            return;
          }

          if (error?.status === 0) {
            this.error = 'No se pudo conectar con el servidor.';
            this.actualizarVista();
            return;
          }

          if (error?.name === 'TimeoutError') {
            this.error = 'El servidor tardó demasiado en responder.';
            this.actualizarVista();
            return;
          }

          this.error =
            error?.error?.message ||
            error?.error?.error ||
            'No se pudo iniciar sesión. Verifica tus datos e intenta nuevamente.';

          this.actualizarVista();
        },
      });
  }

  abrirRecuperacion(): void {
    if (this.loading) return;

    this.error = '';
    this.mensaje = '';
    this.modoRecuperacion = true;
    this.enviandoRecuperacion = false;
    this.emailRecuperacion = this.email.trim().toLowerCase();

    this.actualizarVista();
  }

  cancelarRecuperacion(): void {
    this.error = '';
    this.mensaje = '';
    this.modoRecuperacion = false;
    this.enviandoRecuperacion = false;

    this.actualizarVista();
  }

  limpiarAlertas(): void {
    this.error = '';
    this.mensaje = '';
  }

  togglePassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
    this.actualizarVista();
  }

  enviarCorreoRecuperacion(): void {
    if (this.enviandoRecuperacion) return;

    this.error = '';
    this.mensaje = '';

    const correo = this.emailRecuperacion.trim().toLowerCase();

    if (!correo) {
      this.error = 'Ingresa el correo de tu cuenta.';
      this.actualizarVista();
      return;
    }

    if (!this.emailValido(correo)) {
      this.error = 'Ingresa un correo válido.';
      this.actualizarVista();
      return;
    }

    this.emailRecuperacion = correo;
    this.enviandoRecuperacion = true;
    this.actualizarVista();

    this.authService
      .forgotPassword(correo)
      .pipe(
        timeout(10000),
        finalize(() => {
          this.enviandoRecuperacion = false;
          this.actualizarVista();
        })
      )
      .subscribe({
        next: (response) => {
          this.error = '';
          this.mensaje =
            response?.message ||
            'Si el correo está registrado, recibirás instrucciones para cambiar tu contraseña. Revisa tu bandeja de entrada o la carpeta de spam.';

          this.actualizarVista();
        },

        error: (error) => {
          console.error('Error recuperación:', error);

          if (error?.status === 0) {
            this.error = 'No se pudo conectar con el servidor.';
            this.actualizarVista();
            return;
          }

          if (error?.name === 'TimeoutError') {
            this.error = 'El servidor tardó demasiado en responder.';
            this.actualizarVista();
            return;
          }

          this.error =
            error?.error?.message ||
            error?.error?.error ||
            'No se pudo enviar el correo de recuperación. Intenta nuevamente.';

          this.actualizarVista();
        },
      });
  }

  private emailValido(email: string): boolean {
    const correo = email.trim().toLowerCase();
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (!regex.test(correo)) return false;
    if (correo.includes('..')) return false;

    const partes = correo.split('@');

    if (partes.length !== 2) return false;

    const [usuario, dominio] = partes;

    if (!usuario || !dominio) return false;
    if (usuario.length > 64 || dominio.length > 253) return false;
    if (dominio.startsWith('.') || dominio.endsWith('.')) return false;

    return true;
  }

  private actualizarVista(): void {
    setTimeout(() => {
      this.cdr.detectChanges();
    });
  }
}
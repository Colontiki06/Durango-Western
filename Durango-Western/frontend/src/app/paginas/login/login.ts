import { CommonModule } from '@angular/common';
import {
  ApplicationRef,
  ChangeDetectorRef,
  Component,
  NgZone,
} from '@angular/core';
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
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private appRef: ApplicationRef
  ) {}

  login(): void {
    this.error = '';
    this.mensaje = '';

    if (!this.email.trim()) {
      this.error = 'Ingresa tu correo electrónico.';
      this.refrescarVista();
      return;
    }

    if (!this.password.trim()) {
      this.error = 'Ingresa tu contraseña.';
      this.refrescarVista();
      return;
    }

    this.loading = true;
    this.refrescarVista();

    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.loading = false;
          this.refrescarVista();

          const redirect = this.route.snapshot.queryParamMap.get('redirect');

          if (redirect) {
            this.router.navigateByUrl(redirect);
            return;
          }

          this.router.navigate(['/perfil']);
        });
      },
      error: (error) => {
        this.ngZone.run(() => {
          this.loading = false;

          if (error.status === 401) {
            this.error = 'Correo o contraseña incorrectos.';
            this.refrescarVista();
            return;
          }

          if (error.status === 400) {
            this.error = 'Revisa los datos ingresados.';
            this.refrescarVista();
            return;
          }

          if (error.status === 0) {
            this.error = 'No se pudo conectar con el servidor.';
            this.refrescarVista();
            return;
          }

          this.error = 'No se pudo iniciar sesión. Intenta nuevamente.';
          this.refrescarVista();
        });
      },
    });
  }

  abrirRecuperacion(): void {
    this.error = '';
    this.mensaje = '';
    this.modoRecuperacion = true;
    this.enviandoRecuperacion = false;
    this.emailRecuperacion = this.email.trim().toLowerCase();

    this.refrescarVista();
  }

  cancelarRecuperacion(): void {
    this.error = '';
    this.mensaje = '';
    this.modoRecuperacion = false;
    this.enviandoRecuperacion = false;

    this.refrescarVista();
  }

  limpiarAlertas(): void {
    this.error = '';
    this.mensaje = '';

    this.refrescarVista();
  }

  enviarCorreoRecuperacion(): void {
    this.error = '';
    this.mensaje = '';

    const correo = this.emailRecuperacion.trim().toLowerCase();

    if (!correo) {
      this.error = 'Ingresa el correo de tu cuenta.';
      this.refrescarVista();
      return;
    }

    if (!this.emailValido(correo)) {
      this.error = 'Ingresa un correo válido.';
      this.refrescarVista();
      return;
    }

    this.enviandoRecuperacion = true;
    this.refrescarVista();

    this.authService.forgotPassword(correo).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          this.enviandoRecuperacion = false;
          this.error = '';
          this.mensaje =
            response?.message ||
            'Si el correo está registrado, recibirás instrucciones para cambiar tu contraseña. Revisa tu bandeja de entrada o la carpeta de spam.';

          this.refrescarVista();
        });
      },
      error: (error) => {
        this.ngZone.run(() => {
          this.enviandoRecuperacion = false;
          this.mensaje = '';

          if (error.status === 0) {
            this.error = 'No se pudo conectar con el servidor.';
            this.refrescarVista();
            return;
          }

          this.error =
            error?.error?.message ||
            'No se pudo enviar el correo de recuperación. Intenta nuevamente.';

          this.refrescarVista();
        });
      },
    });
  }

  private emailValido(email: string): boolean {
    const correo = email.trim().toLowerCase();

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

  private refrescarVista(): void {
    setTimeout(() => {
      this.cdr.detectChanges();
      this.appRef.tick();
    }, 0);
  }
}
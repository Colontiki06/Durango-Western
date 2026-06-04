import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
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

  error = '';
  loading = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  login(): void {
    this.error = '';

    if (!this.email.trim()) {
      this.error = 'Ingresa tu correo electrónico.';
      return;
    }

    if (!this.password.trim()) {
      this.error = 'Ingresa tu contraseña.';
      return;
    }

    this.loading = true;

    const loginCorrecto = this.authService.login(this.email, this.password);

    this.loading = false;

    if (!loginCorrecto) {
      this.error = 'No se pudo iniciar sesión.';
      return;
    }

    this.router.navigate(['/perfil']);
  }
}
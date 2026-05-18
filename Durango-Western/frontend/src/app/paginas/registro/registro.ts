import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../core/services/auth';

@Component({
  selector: 'app-registro',
  imports: [RouterLink, FormsModule],
  templateUrl: './registro.html',
  styleUrl: './registro.css'
})
export class Registro {
  fullName = '';
  email = '';
  password = '';
  confirmPassword = '';

  constructor(
    private router: Router,
    private auth: Auth
  ) {}

  register(): void {
    if (!this.fullName || !this.email || !this.password || !this.confirmPassword) {
      alert('Completa todos los campos');
      return;
    }

    if (this.password !== this.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    this.auth.login();
    this.router.navigate(['/perfil']);
  }
}
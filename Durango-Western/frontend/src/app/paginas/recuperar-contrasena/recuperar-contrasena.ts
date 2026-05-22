import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-recuperar-contrasena',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './recuperar-contrasena.html',
  styleUrl: './recuperar-contrasena.css'
})
export class RecuperarContrasena {

  email = '';
  mensajeExito = false;

  enviarEnlace(): void {
    if (!this.email.trim()) {
      return;
    }

    this.mensajeExito = true;

    console.log('Enviar enlace de recuperación a:', this.email);
  }

}
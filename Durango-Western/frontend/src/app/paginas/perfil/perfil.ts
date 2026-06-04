import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import {
  AuthService,
  UsuarioSesion,
} from '../../core/services/auth/auth.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil implements OnInit {
  usuario: UsuarioSesion | null = null;

  editandoPerfil = false;

  nombreEdit = '';
  correoEdit = '';

  mensaje = '';
  error = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarUsuario();
  }

  cargarUsuario(): void {
    this.usuario = this.authService.getUser();

    this.nombreEdit = this.usuario?.nombre || 'Sin nombre registrado';
    this.correoEdit = this.usuario?.email || '';
  }

  activarEdicion(): void {
    this.error = '';
    this.mensaje = '';
    this.editandoPerfil = true;

    this.nombreEdit = this.usuario?.nombre || '';
    this.correoEdit = this.usuario?.email || '';
  }

  cancelarEdicion(): void {
    this.editandoPerfil = false;
    this.error = '';
    this.mensaje = '';

    this.nombreEdit = this.usuario?.nombre || '';
    this.correoEdit = this.usuario?.email || '';
  }

  guardarPerfil(): void {
    this.error = '';
    this.mensaje = '';

    if (!this.nombreEdit.trim()) {
      this.error = 'El nombre no puede estar vacío.';
      return;
    }

    if (!this.correoEdit.trim()) {
      this.error = 'El correo no puede estar vacío.';
      return;
    }

    this.authService.updateUser({
      nombre: this.nombreEdit.trim(),
      email: this.correoEdit.trim(),
    });

    this.cargarUsuario();

    this.editandoPerfil = false;
    this.mensaje = 'Perfil actualizado correctamente.';
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  irAPedidos(): void {
    this.router.navigate(['/pedidos']);
  }

  irAMetodosPago(): void {
    this.mensaje = 'La sección de métodos de pago se agregará más adelante.';
  }

  obtenerInicial(): string {
    const nombre = this.usuario?.nombre || this.usuario?.email || 'U';
    return nombre.charAt(0).toUpperCase();
  }
}
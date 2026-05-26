import { Component, EventEmitter, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-sidebar-admin',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    FormsModule
  ],
  templateUrl: './sidebar-admin.html',
  styleUrl: './sidebar-admin.css'
})
export class SidebarAdmin {

  @Output() navigate = new EventEmitter<void>();

  mostrarConfirmacion = false;
  noVolverMostrar = false;

  cerrarMenu(): void {
    this.navigate.emit();
  }

  cerrarSesion(): void {
    const omitido = localStorage.getItem('skip_logout_confirm');

    if (omitido === 'true') {
      localStorage.removeItem('admin_logged');
      window.location.href = '/admin/login';
      return;
    }

    this.mostrarConfirmacion = true;
  }

  confirmarCerrarSesion(): void {
    if (this.noVolverMostrar) {
      localStorage.setItem('skip_logout_confirm', 'true');
    }

    localStorage.removeItem('admin_logged');
    window.location.href = '/admin/login';
  }

  cancelarCerrarSesion(): void {
    this.mostrarConfirmacion = false;
  }

}
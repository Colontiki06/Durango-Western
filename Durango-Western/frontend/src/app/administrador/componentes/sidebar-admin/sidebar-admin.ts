import { Component, EventEmitter, OnInit, Output, inject, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { SupabaseService } from '../../../core/services/auth/supabase.service';

@Component({
  selector: 'app-sidebar-admin',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './sidebar-admin.html',
  styleUrl: './sidebar-admin.css',
})
export class SidebarAdmin implements OnInit {
  @Output() navigate = new EventEmitter<void>();

  private router = inject(Router);
  private supabaseService = inject(SupabaseService);
  private cdr = inject(ChangeDetectorRef);

  mostrarConfirmacion = false;
  noVolverMostrar = false;

  nombreAdmin = 'Administrador';
  rolAdmin = 'Administrador';
  inicialAdmin = 'A';

  async ngOnInit(): Promise<void> {
    setTimeout(async () => {
      await this.cargarDatosAdmin();
    });
  }

  private async cargarDatosAdmin(): Promise<void> {
    const { data: sessionData } = await this.supabaseService.getSession();
    const session = sessionData.session;

    if (!session?.user) {
      return;
    }

    const { data: profile } = await this.supabaseService.client
      .from('profiles')
      .select('nombre, rol')
      .eq('id', session.user.id)
      .single();

    if (!profile) {
      return;
    }

    const nombreCompleto = String(profile.nombre || 'Administrador').trim();
    const partesNombre = nombreCompleto.split(' ').filter(Boolean);

    this.nombreAdmin = partesNombre[0] || 'Administrador';

    this.rolAdmin =
      profile.rol === 'admin'
        ? 'Administrador'
        : String(profile.rol || 'Administrador');

    this.inicialAdmin =
      partesNombre.length > 1
        ? `${partesNombre[0][0]}${partesNombre[1][0]}`.toUpperCase()
        : (partesNombre[0]?.[0] || 'A').toUpperCase();

    this.cdr.detectChanges();
  }

  cerrarMenu(): void {
    this.navigate.emit();
  }

  async cerrarSesion(): Promise<void> {
    const omitido = localStorage.getItem('skip_logout_confirm');

    if (omitido === 'true') {
      await this.ejecutarCerrarSesion();
      return;
    }

    this.mostrarConfirmacion = true;
  }

  async confirmarCerrarSesion(): Promise<void> {
    if (this.noVolverMostrar) {
      localStorage.setItem('skip_logout_confirm', 'true');
    }

    await this.ejecutarCerrarSesion();
  }

  cancelarCerrarSesion(): void {
    this.mostrarConfirmacion = false;
  }

  private async ejecutarCerrarSesion(): Promise<void> {
    await this.supabaseService.signOut();

    localStorage.removeItem('admin_logged');

    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });

    await this.router.navigate(['/admin/login']);
  }
}
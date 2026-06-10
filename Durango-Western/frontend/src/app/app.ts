import { Component, ChangeDetectorRef, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { Navbar } from './layout/components/navbar/navbar';
import { Footer } from './layout/components/footer/footer';
import { ApiService } from './core/services/api/api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Navbar, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

  private router = inject(Router);
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  currentUrl = '';

  estadoTienda = signal('Activa');
  cargandoConfiguracion = signal(true);

  constructor() {
    this.currentUrl = this.router.url;

    this.cargarEstadoTienda();

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentUrl = event.urlAfterRedirects;
        console.log('RUTA ACTUAL:', this.currentUrl);

        this.cargarEstadoTienda();
        this.cdr.detectChanges();
      });
  }

  cargarEstadoTienda(): void {
    this.cargandoConfiguracion.set(true);

    this.api.get<any>('configuraciones').subscribe({
      next: (config) => {
        this.estadoTienda.set(config?.estado_tienda ?? 'Activa');
        this.cargandoConfiguracion.set(false);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error cargando estado de tienda:', error);
        this.estadoTienda.set('Activa');
        this.cargandoConfiguracion.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  isAdminRoute(): boolean {
    return this.currentUrl.startsWith('/admin');
  }

  tiendaEnMantenimiento(): boolean {
    return (
      !this.isAdminRoute() &&
      this.estadoTienda().toLowerCase().includes('mantenimiento')
    );
  }
}
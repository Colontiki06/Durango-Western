import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, filter } from 'rxjs';

import {
  AuthService,
  UsuarioSesion,
} from '../../../core/services/auth/auth.service';

import { CartService } from '../../../core/services/cart/cart.service';
import { ApiService } from '../../../core/services/api/api.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit, OnDestroy {
  cartCount = 0;
  envioGratisMinimo = signal(4000);

  searchOpen = false;
  userMenuOpen = false;

  terminoBusqueda = '';
  sugerenciasBusqueda: any[] = [];
  buscandoSugerencias = false;
  busquedaSinResultados = false;

  usuario: UsuarioSesion | null = null;

  private timerBusqueda?: ReturnType<typeof setTimeout>;
  private cartSubscription?: Subscription;
  private routerSubscription?: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService,
    private cartService: CartService,
    private api: ApiService,
  ) {}

  ngOnInit(): void {
    this.cargarConfiguracionTienda();
    this.actualizarUsuario();

    this.cartCount = this.cartService.getTotalItems();

    this.cartSubscription = this.cartService.cartItems$.subscribe(() => {
      this.cartCount = this.cartService.getTotalItems();
    });

    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.actualizarUsuario();
        this.cerrarBuscador();
        this.userMenuOpen = false;
      });
  }

  ngOnDestroy(): void {
    this.cartSubscription?.unsubscribe();
    this.routerSubscription?.unsubscribe();
    this.limpiarTimerBusqueda();
  }

  cargarConfiguracionTienda(): void {
    this.api.get<any>('configuraciones').subscribe({
      next: (config) => {
        this.envioGratisMinimo.set(Number(config?.envio_gratis_desde ?? 4000));
      },
      error: (error) => {
        console.error('Error cargando configuración de tienda:', error);
        this.envioGratisMinimo.set(4000);
      },
    });
  }

  toggleSearch(): void {
    this.searchOpen = !this.searchOpen;
    this.userMenuOpen = false;

    if (!this.searchOpen) {
      this.limpiarBusqueda();
    }
  }

  cerrarBuscador(): void {
    this.searchOpen = false;
    this.limpiarBusqueda();
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda = '';
    this.sugerenciasBusqueda = [];
    this.buscandoSugerencias = false;
    this.busquedaSinResultados = false;
    this.limpiarTimerBusqueda();
  }

  limpiarTimerBusqueda(): void {
    if (this.timerBusqueda) {
      clearTimeout(this.timerBusqueda);
      this.timerBusqueda = undefined;
    }
  }

  toggleUserMenu(): void {
    this.actualizarUsuario();
    this.userMenuOpen = !this.userMenuOpen;
    this.searchOpen = false;
    this.limpiarBusqueda();
  }

  buscarProductos(): void {
    const texto = this.terminoBusqueda.trim();

    if (!texto) {
      return;
    }

    this.searchOpen = false;
    this.sugerenciasBusqueda = [];
    this.busquedaSinResultados = false;
    this.limpiarTimerBusqueda();

    this.router.navigate(['/productos'], {
      queryParams: {
        buscar: texto,
      },
    });
  }

  buscarSugerencias(texto: string): void {
    this.limpiarTimerBusqueda();

    const busqueda = texto.trim();

    this.busquedaSinResultados = false;

    if (busqueda.length < 2) {
      this.sugerenciasBusqueda = [];
      this.buscandoSugerencias = false;
      return;
    }

    this.buscandoSugerencias = true;

    this.timerBusqueda = setTimeout(() => {
      this.api
        .get<any[]>('productos', {
          publico: true,
          buscar: busqueda,
          precioMin: 0,
          precioMax: 10000,
        })
        .subscribe({
          next: (productos) => {
            this.sugerenciasBusqueda = productos.slice(0, 5);
            this.busquedaSinResultados = productos.length === 0;
            this.buscandoSugerencias = false;
          },
          error: (error) => {
            console.error('Error buscando sugerencias:', error);
            this.sugerenciasBusqueda = [];
            this.busquedaSinResultados = true;
            this.buscandoSugerencias = false;
          },
        });
    }, 300);
  }

  irAProducto(producto: any): void {
    this.searchOpen = false;
    this.terminoBusqueda = '';
    this.sugerenciasBusqueda = [];
    this.busquedaSinResultados = false;
    this.limpiarTimerBusqueda();

    this.router.navigate(['/detalle-producto', producto.slug]);
  }

  isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }

  actualizarUsuario(): void {
    this.usuario = this.authService.getUser();
  }

  goTo(path: string): void {
    this.userMenuOpen = false;
    this.searchOpen = false;
    this.limpiarBusqueda();
    this.router.navigate([path]);
  }

  logout(): void {
    this.authService.logout();
    this.usuario = null;
    this.userMenuOpen = false;
    this.searchOpen = false;
    this.limpiarBusqueda();
    this.router.navigate(['/login']);
  }

  obtenerNombreUsuario(): string {
    if (!this.usuario) {
      return '';
    }

    return this.usuario.nombre || this.usuario.email || 'Cliente';
  }
}
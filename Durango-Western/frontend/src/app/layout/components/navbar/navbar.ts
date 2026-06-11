import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
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
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit, OnDestroy {
  cartCount = 0;
  envioGratisMinimo = signal(4000);

  searchOpen = false;
  userMenuOpen = false;

  usuario: UsuarioSesion | null = null;

  private cartSubscription?: Subscription;
  private routerSubscription?: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService,
    private cartService: CartService,
    private api: ApiService
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
        this.userMenuOpen = false;
        this.searchOpen = false;
      });
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

  ngOnDestroy(): void {
    this.cartSubscription?.unsubscribe();
    this.routerSubscription?.unsubscribe();
  }

  toggleSearch(): void {
    this.searchOpen = !this.searchOpen;
    this.userMenuOpen = false;
  }

  toggleUserMenu(): void {
    this.actualizarUsuario();
    this.userMenuOpen = !this.userMenuOpen;
    this.searchOpen = false;
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
    this.router.navigate([path]);
  }

  logout(): void {
    this.authService.logout();
    this.usuario = null;
    this.userMenuOpen = false;
    this.searchOpen = false;
    this.router.navigate(['/login']);
  }

  obtenerNombreUsuario(): string {
    if (!this.usuario) {
      return '';
    }

    return this.usuario.nombre || this.usuario.email || 'Cliente';
  }
}
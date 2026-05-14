import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [

  {
    path: '',
    loadComponent: () =>
      import('./paginas/inicio/inicio')
        .then(m => m.Inicio)
  },

  {
    path: 'productos',
    loadComponent: () =>
      import('./paginas/productos/productos')
        .then(m => m.Productos)
  },

  {
    path: 'productos/:categoria',
    loadComponent: () =>
      import('./paginas/productos/productos')
        .then(m => m.Productos)
  },

  {
    path: 'detalle-producto/:slug',
    loadComponent: () =>
      import('./paginas/detalle-producto/detalle-producto')
        .then(m => m.DetalleProducto)
  },

  {
    path: 'carrito',
    loadComponent: () =>
      import('./paginas/carrito/carrito')
        .then(m => m.Carrito)
  },

  {
    path: 'checkout',
    // canActivate: [authGuard],
    loadComponent: () =>
      import('./paginas/checkout/checkout')
        .then(m => m.Checkout)
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./paginas/login/login')
        .then(m => m.Login)
  },

  {
    path: 'registro',
    loadComponent: () =>
      import('./paginas/registro/registro')
        .then(m => m.Registro)
  },

  {
    path: '**',
    redirectTo: ''
  }

];
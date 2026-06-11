import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin-guard';

export const routes: Routes = [
  {
    path: 'admin',
    data: { hideLayout: true },
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./administrador/auth/login-admin/login-admin').then(
            (m) => m.LoginAdmin,
          ),
      },
      {
        path: '',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./layout/admin-layout/admin-layout').then(
            (m) => m.AdminLayout,
          ),
        children: [
          {
            path: '',
            redirectTo: 'dashboard',
            pathMatch: 'full',
          },
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./administrador/dashboard/dashboard').then(
                (m) => m.Dashboard,
              ),
          },
          {
            path: 'inventario',
            loadComponent: () =>
              import('./administrador/productos/inventario/inventario').then(
                (m) => m.Inventario,
              ),
          },
          {
            path: 'pedidos',
            loadComponent: () =>
              import('./administrador/pedidos/pedidos').then(
                (m) => m.Pedidos,
              ),
          },
          {
            path: 'pedidos/:id',
            loadComponent: () =>
              import(
                './administrador/pedidos/detalle-pedido/detalle-pedido'
              ).then((m) => m.DetallePedido),
          },
          {
            path: 'agregar-producto',
            loadComponent: () =>
              import(
                './administrador/productos/agregar-producto/agregar-producto'
              ).then((m) => m.AgregarProducto),
          },
          {
            path: 'editar-producto/:id',
            loadComponent: () =>
              import(
                './administrador/productos/editar-producto/editar-producto'
              ).then((m) => m.EditarProducto),
          },
          {
            path: 'configuracion',
            loadComponent: () =>
              import('./administrador/configuracion/configuracion').then(
                (m) => m.Configuracion,
              ),
          },
          {
            path: 'personalizar-inicio',
            loadComponent: () =>
              import(
                './administrador/cms/personalizar-inicio/personalizar-inicio'
              ).then((m) => m.PersonalizarInicio),
          },
        ],
      },
    ],
  },

  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./paginas/inicio/inicio').then((m) => m.Inicio),
  },

  {
    path: 'productos',
    loadComponent: () =>
      import('./paginas/productos/productos').then((m) => m.Productos),
  },

  {
    path: 'productos/:categoria',
    loadComponent: () =>
      import('./paginas/productos/productos').then((m) => m.Productos),
  },

  {
    path: 'detalle-producto/:slug',
    loadComponent: () =>
      import('./paginas/detalle-producto/detalle-producto').then(
        (m) => m.DetalleProducto,
      ),
  },

  {
    path: 'carrito',
    loadComponent: () =>
      import('./paginas/carrito/carrito').then((m) => m.Carrito),
  },

  {
    path: 'checkout',
    loadComponent: () =>
      import('./paginas/checkout/checkout').then((m) => m.Checkout),
  },

  {
    path: 'pago-exitoso',
    loadComponent: () =>
      import('./paginas/confirmacion-compra/confirmacion-compra').then(
        (m) => m.ConfirmacionCompra,
      ),
  },

  {
    path: 'pago-pendiente',
    loadComponent: () =>
      import('./paginas/confirmacion-compra/confirmacion-compra').then(
        (m) => m.ConfirmacionCompra,
      ),
  },

  {
    path: 'pago-fallido',
    loadComponent: () =>
      import('./paginas/confirmacion-compra/confirmacion-compra').then(
        (m) => m.ConfirmacionCompra,
      ),
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./paginas/login/login').then((m) => m.Login),
  },

  {
    path: 'registro',
    loadComponent: () =>
      import('./paginas/registro/registro').then((m) => m.Registro),
  },

  {
    path: 'nosotros',
    loadComponent: () =>
      import('./paginas/nosotros/nosotros').then((m) => m.Nosotros),
  },

  {
    path: 'contacto',
    loadComponent: () =>
      import('./paginas/contacto/contacto').then((m) => m.Contacto),
  },

  {
    path: 'encontrar-tienda',
    loadComponent: () =>
      import('./paginas/encontrar-tienda/encontrar-tienda').then(
        (m) => m.EncontrarTienda,
      ),
  },

  {
    path: 'perfil',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./paginas/perfil/perfil').then((m) => m.Perfil),
  },

  {
    path: 'pedidos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./paginas/pedidos/pedidos').then((m) => m.Pedidos),
  },

  {
    path: 'ofertas',
    loadComponent: () =>
      import('./paginas/ofertas/ofertas').then((m) => m.Ofertas),
  },

  {
    path: 'recuperar-contrasena',
    loadComponent: () =>
      import('./paginas/recuperar-contrasena/recuperar-contrasena').then(
        (m) => m.RecuperarContrasena,
      ),
  },

  {
    path: 'restablecer-password',
    loadComponent: () =>
      import('./paginas/restablecer-contrasena/restablecer-contrasena').then(
        (m) => m.RestablecerContrasena,
      ),
  },

  {
    path: '**',
    redirectTo: '',
  },
];
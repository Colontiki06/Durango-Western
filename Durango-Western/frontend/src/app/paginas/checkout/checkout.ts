import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { environment } from '../../../environments/environment';

import { CartService, CartItem } from '../../core/services/cart/cart.service';
import { ApiService } from '../../core/services/api/api.service';
import { AuthService } from '../../core/services/auth/auth.service';

type TipoEntrega = 'domicilio' | 'tienda';

interface DireccionUsuario {
  id: string;
  usuario_id: string;
  nombre_recibe: string;
  telefono?: string | null;
  calle: string;
  numero?: string | null;
  colonia?: string | null;
  ciudad: string;
  estado: string;
  codigo_postal: string;
  referencias?: string | null;
  principal: boolean;
  created_at?: string;
  updated_at?: string;
}

interface ClienteCheckout {
  nombre: string;
  correo: string;
  telefono: string;
}

interface DireccionCheckout {
  codigoPostal: string;
  calle: string;
  numeroExterior: string;
  numeroInterior: string;
  colonia: string;
  ciudad: string;
  estado: string;
  referencias: string;
}

type ErroresCliente = Partial<Record<keyof ClienteCheckout, string>>;
type ErroresDireccion = Partial<Record<keyof DireccionCheckout, string>>;

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, FormsModule, RouterLink],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout implements OnInit {
  readonly envioGratisMinimo = 4000;

  cargando = false;
  cargandoDirecciones = false;
  direccionListaParaMostrar = false;
  cotizandoEnvio = false;

  tipoEntrega: TipoEntrega = 'domicilio';

  costoEnvio = 0;
  envioGratis = false;
  mensajeEnvio = '';
  tarifasEnvio: any[] = [];
  tarifaEnvioSeleccionada: any = null;
  skydropxQuotationId = '';

  direccionesGuardadas: DireccionUsuario[] = [];
  direccionSeleccionadaId = '';

  mensaje = '';
  error = '';

  erroresCliente: ErroresCliente = {};
  erroresDireccion: ErroresDireccion = {};

  cliente: ClienteCheckout = {
    nombre: '',
    correo: '',
    telefono: '',
  };

  direccion: DireccionCheckout = this.obtenerDireccionVacia();

  constructor(
    private cartService: CartService,
    private api: ApiService,
    private authService: AuthService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.precargarCliente();
    this.cargarDireccionesGuardadas();
  }

  items(): CartItem[] {
    return this.cartService.cartItems;
  }

  subtotal(): number {
    return this.cartService.getSubtotal();
  }

  envio(): number {
    if (this.tipoEntrega === 'tienda') return 0;
    return this.costoEnvio;
  }

  total(): number {
    return this.subtotal() + this.envio();
  }

  carritoVacio(): boolean {
    return this.items().length === 0;
  }

  seleccionarEntrega(tipo: TipoEntrega): void {
    this.tipoEntrega = tipo;
    this.error = '';
    this.mensaje = '';
    this.erroresDireccion = {};

    if (tipo === 'tienda') {
      this.direccionSeleccionadaId = '';
      this.direccionListaParaMostrar = true;
      this.costoEnvio = 0;
      this.envioGratis = true;
      this.tarifasEnvio = [];
      this.tarifaEnvioSeleccionada = null;
      this.skydropxQuotationId = '';
      this.mensajeEnvio = 'Recolección en tienda sin costo';
      this.cdr.detectChanges();
      return;
    }

    if (tipo === 'domicilio') {
      this.envioGratis = false;

      if (this.direccionesGuardadas.length > 0) {
        const principal =
          this.direccionesGuardadas.find((direccion) => direccion.principal) ||
          this.direccionesGuardadas[0];

        this.seleccionarDireccionGuardada(principal.id);
      }

      this.direccionListaParaMostrar = true;
      this.cotizarEnvio();
      this.cdr.detectChanges();
    }
  }

  cargarDireccionesGuardadas(): void {
    const token = this.authService.getToken();

    if (!token) {
      this.cargandoDirecciones = false;
      this.direccionListaParaMostrar = true;
      this.cdr.detectChanges();
      return;
    }

    this.cargandoDirecciones = true;
    this.direccionListaParaMostrar = false;
    this.direccionSeleccionadaId = '';

    this.cdr.detectChanges();

    this.http
      .get<DireccionUsuario[]>(`${environment.apiUrl}/direcciones`, {
        headers: this.getAuthHeaders(),
      })
      .subscribe({
        next: (direcciones) => {
          this.direccionesGuardadas = direcciones || [];

          if (
            this.tipoEntrega === 'domicilio' &&
            this.direccionesGuardadas.length > 0
          ) {
            const principal =
              this.direccionesGuardadas.find((direccion) => direccion.principal) ||
              this.direccionesGuardadas[0];

            this.direccionSeleccionadaId = principal.id;
            this.aplicarDireccionGuardada(principal);
            this.cotizarEnvio();
          }

          this.cargandoDirecciones = false;
          this.direccionListaParaMostrar = true;

          this.cdr.detectChanges();
        },
        error: () => {
          this.cargandoDirecciones = false;
          this.direccionListaParaMostrar = true;

          this.cdr.detectChanges();
        },
      });
  }

  seleccionarDireccionGuardada(direccionId: string): void {
    const direccionEncontrada = this.direccionesGuardadas.find(
      (direccion) => direccion.id === direccionId
    );

    if (!direccionEncontrada) return;

    this.direccionSeleccionadaId = direccionEncontrada.id;
    this.aplicarDireccionGuardada(direccionEncontrada);
    this.erroresDireccion = {};
    this.cotizarEnvio();

    this.cdr.detectChanges();
  }

  usarNuevaDireccion(): void {
    this.direccionSeleccionadaId = '';
    this.direccion = this.obtenerDireccionVacia();
    this.erroresDireccion = {};
    this.direccionListaParaMostrar = true;
    this.tarifasEnvio = [];
    this.tarifaEnvioSeleccionada = null;
    this.costoEnvio = 0;
    this.skydropxQuotationId = '';
    this.cotizarEnvio();

    this.cdr.detectChanges();
  }

  cotizarEnvio(): void {
    if (this.tipoEntrega !== 'domicilio') return;

    this.tarifasEnvio = [];
    this.tarifaEnvioSeleccionada = null;
    this.skydropxQuotationId = '';

    if (!this.direccion.codigoPostal || this.direccion.codigoPostal.length < 5) {
      this.costoEnvio = 0;
      this.envioGratis = false;
      this.mensajeEnvio = 'Ingresa tu código postal para calcular el envío';
      return;
    }

    this.cotizandoEnvio = true;
    this.mensajeEnvio = 'Calculando envío...';

    this.api
      .post<any>('envios/cotizar', {
        codigoPostal: this.direccion.codigoPostal,
        subtotal: this.subtotal(),
        items: this.items()
          .filter((item) => !!item.variante_id)
          .map((item) => ({
            variante_id: item.variante_id,
            cantidad: item.cantidad,
          })),
      })
      .subscribe({
        next: (respuesta) => {
          this.skydropxQuotationId = respuesta.skydropxQuotationId ?? '';

          this.tarifasEnvio = [
            {
              tipo: 'Económico',
              descripcion: 'La opción más barata',
              tarifa: respuesta.opcionEconomica,
            },
            {
              tipo: 'Recomendado',
              descripcion: 'Balance entre precio y tiempo',
              tarifa: respuesta.opcionRecomendada,
            },
            {
              tipo: 'Express',
              descripcion: 'La opción más rápida',
              tarifa: respuesta.opcionExpress,
            },
          ].filter((opcion) => !!opcion.tarifa);

          this.tarifaEnvioSeleccionada = respuesta.tarifaSeleccionada ?? null;
          this.costoEnvio = Number(respuesta.costoEnvio ?? 0);
          this.envioGratis = Boolean(respuesta.envioGratis);

          if (this.envioGratis) {
            this.tarifaEnvioSeleccionada = null;
            this.mensajeEnvio = 'Tu compra tiene envío gratis';
          } else {
            this.mensajeEnvio = 'Selecciona la paquetería que prefieras';
          }

          this.cotizandoEnvio = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error cotizando envío:', error);
          this.costoEnvio = 0;
          this.envioGratis = false;
          this.tarifasEnvio = [];
          this.tarifaEnvioSeleccionada = null;
          this.mensajeEnvio = 'No se pudo calcular el envío';
          this.cotizandoEnvio = false;
          this.cdr.detectChanges();
        },
      });
  }

  seleccionarTarifaEnvio(opcion: any): void {
    if (this.envioGratis) return;

    const tarifa = opcion?.tarifa ?? opcion;

    this.tarifaEnvioSeleccionada = tarifa;
    this.costoEnvio = Number(tarifa?.total ?? 0);

    this.cdr.detectChanges();
  }

  realizarPedido(): void {
    this.error = '';
    this.mensaje = '';

    if (this.carritoVacio()) {
      this.error = 'Tu carrito está vacío.';
      return;
    }

    const formularioValido = this.validarCheckout();

    if (!formularioValido) {
      this.error = 'Revisa los campos marcados antes de continuar.';
      return;
    }

    if (
      this.tipoEntrega === 'domicilio' &&
      !this.envioGratis &&
      !this.tarifaEnvioSeleccionada
    ) {
      this.error = 'Selecciona una opción de envío antes de continuar.';
      return;
    }

    if (this.tipoEntrega === 'domicilio' && this.direccionSeleccionadaId) {
      const direccionGuardada = this.direccionesGuardadas.find(
        (direccion) => direccion.id === this.direccionSeleccionadaId
      );

      if (direccionGuardada) {
        this.aplicarDireccionGuardada(direccionGuardada);
      }
    }

    this.cargando = true;

    const payload = {
      cliente: {
        nombre: this.cliente.nombre.trim(),
        correo: this.cliente.correo.trim().toLowerCase(),
        telefono: this.limpiarTelefono(this.cliente.telefono),
      },
      direccion:
        this.tipoEntrega === 'domicilio'
          ? {
              direccionGuardadaId: this.direccionSeleccionadaId || null,
              codigoPostal: this.direccion.codigoPostal.trim(),
              calle: this.direccion.calle.trim(),
              numeroExterior: this.direccion.numeroExterior.trim(),
              numeroInterior: this.direccion.numeroInterior.trim() || null,
              colonia: this.direccion.colonia.trim(),
              ciudad: this.direccion.ciudad.trim(),
              estado: this.direccion.estado.trim(),
              referencias: this.direccion.referencias.trim() || null,
            }
          : null,
      tipoEntrega: this.tipoEntrega,
      envio: this.envio(),
      subtotal: this.subtotal(),
      total: this.total(),
      tarifaEnvio: this.tarifaEnvioSeleccionada,
      skydropxQuotationId: this.skydropxQuotationId,
      items: this.items().map((item) => ({
        producto_id: item.producto_id || item.id,
        variante_id: item.variante_id,
        nombre: item.nombre,
        codigo: item.codigo,
        talla: item.talla,
        precio: item.precio,
        cantidad: item.cantidad,
      })),
    };

    this.api.post<any>('pedidos', payload).subscribe({
      next: (pedido) => {
        localStorage.setItem('pedido_actual', JSON.stringify(pedido));

        this.api
          .post<any>('pagos/mercado-pago/preferencia', {
            pedidoId: pedido.id,
          })
          .subscribe({
            next: (respuesta) => {
              const urlPago =
                respuesta.sandbox_init_point || respuesta.init_point;

              if (!urlPago) {
                this.error = 'No se pudo generar la liga de pago.';
                this.cargando = false;
                this.cdr.detectChanges();
                return;
              }

              window.location.href = urlPago;
            },
            error: (error) => {
              console.error('Error creando preferencia:', error);
              this.error =
                'El pedido fue creado, pero no se pudo iniciar el pago.';
              this.cargando = false;
              this.cdr.detectChanges();
            },
          });
      },
      error: (error) => {
        console.error('Error creando pedido:', error);
        this.error = error?.error?.message || 'No fue posible crear el pedido.';
        this.cargando = false;
        this.cdr.detectChanges();
      },
    });
  }

  validarCheckout(): boolean {
    this.erroresCliente = {};
    this.erroresDireccion = {};

    const erroresCliente: ErroresCliente = {};
    const erroresDireccion: ErroresDireccion = {};

    const nombre = this.cliente.nombre.trim();
    const correo = this.cliente.correo.trim().toLowerCase();
    const telefono = this.limpiarTelefono(this.cliente.telefono);

    if (!nombre) {
      erroresCliente.nombre = 'Ingresa tu nombre completo.';
    } else if (nombre.length < 3) {
      erroresCliente.nombre = 'El nombre debe tener al menos 3 caracteres.';
    }

    if (!correo) {
      erroresCliente.correo = 'Ingresa tu correo electrónico.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      erroresCliente.correo = 'Ingresa un correo válido.';
    }

    if (!telefono) {
      erroresCliente.telefono = 'Ingresa tu teléfono.';
    } else if (telefono.length !== 10) {
      erroresCliente.telefono = 'El teléfono debe tener 10 dígitos.';
    }

    if (this.tipoEntrega === 'domicilio') {
      const codigoPostal = this.direccion.codigoPostal.trim();
      const calle = this.direccion.calle.trim();
      const numeroExterior = this.direccion.numeroExterior.trim();
      const colonia = this.direccion.colonia.trim();
      const ciudad = this.direccion.ciudad.trim();
      const estado = this.direccion.estado.trim();
      const referencias = this.direccion.referencias.trim();

      if (!codigoPostal) {
        erroresDireccion.codigoPostal = 'Ingresa tu código postal.';
      } else if (!/^\d{5}$/.test(codigoPostal)) {
        erroresDireccion.codigoPostal =
          'El código postal debe tener 5 dígitos.';
      }

      if (!estado) {
        erroresDireccion.estado = 'Ingresa el estado.';
      }

      if (!ciudad) {
        erroresDireccion.ciudad = 'Ingresa la ciudad.';
      }

      if (!colonia) {
        erroresDireccion.colonia = 'Ingresa la colonia.';
      }

      if (!calle) {
        erroresDireccion.calle = 'Ingresa la calle.';
      } else if (calle.length < 3) {
        erroresDireccion.calle = 'La calle debe tener al menos 3 caracteres.';
      }

      if (!numeroExterior) {
        erroresDireccion.numeroExterior = 'Ingresa el número exterior.';
      }

      if (referencias.length > 250) {
        erroresDireccion.referencias =
          'Las referencias no pueden superar 250 caracteres.';
      }
    }

    this.erroresCliente = erroresCliente;
    this.erroresDireccion = erroresDireccion;

    return (
      Object.keys(this.erroresCliente).length === 0 &&
      Object.keys(this.erroresDireccion).length === 0
    );
  }

  obtenerDireccionCompleta(direccion: DireccionUsuario): string {
    const partes = [
      direccion.calle,
      direccion.numero,
      direccion.colonia,
      direccion.ciudad,
      direccion.estado,
      direccion.codigo_postal,
    ];

    return partes.filter(Boolean).join(', ');
  }

  private precargarCliente(): void {
    const usuario = this.authService.getUser();

    if (!usuario) return;

    this.cliente = {
      nombre: usuario.nombre || '',
      correo: usuario.email || '',
      telefono: usuario.telefono || '',
    };

    this.cdr.detectChanges();
  }

  private aplicarDireccionGuardada(direccion: DireccionUsuario): void {
    this.direccion = {
      codigoPostal: direccion.codigo_postal || '',
      calle: direccion.calle || '',
      numeroExterior: direccion.numero || '',
      numeroInterior: '',
      colonia: direccion.colonia || '',
      ciudad: direccion.ciudad || '',
      estado: direccion.estado || '',
      referencias: direccion.referencias || '',
    };
  }

  private obtenerDireccionVacia(): DireccionCheckout {
    return {
      codigoPostal: '',
      calle: '',
      numeroExterior: '',
      numeroInterior: '',
      colonia: '',
      ciudad: 'Durango',
      estado: 'Durango',
      referencias: '',
    };
  }

  private limpiarTelefono(telefono: string): string {
    return telefono.replace(/\D/g, '');
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }
}
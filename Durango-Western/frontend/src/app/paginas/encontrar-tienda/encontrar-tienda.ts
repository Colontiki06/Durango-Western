import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  NgZone,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GoogleMapsModule } from '@angular/google-maps';

import { Tienda, TiendasService } from '../../core/services/tiendas/tiendas.service';
import { GoogleMapsLoaderService } from '../../core/services/google-maps/google-maps-loader.service';

type TiendaConDistancia = Tienda & {
  distanciaKm?: number;
};

@Component({
  selector: 'app-encontrar-tienda',
  standalone: true,
  imports: [CommonModule, FormsModule, GoogleMapsModule],
  templateUrl: './encontrar-tienda.html',
  styleUrls: ['./encontrar-tienda.css'],
})
export class EncontrarTienda implements OnInit, AfterViewInit {
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  todasLasTiendas: Tienda[] = [];
  tiendas: TiendaConDistancia[] = [];

  tiendaSeleccionada?: TiendaConDistancia;

  busqueda = '';
  origenBusqueda = '';
  mensajeBusqueda = '';

  cargandoBusqueda = false;
  cargandoUbicacion = false;
  mapaCargado = false;

  center: google.maps.LatLngLiteral = {
    lat: 24.02772,
    lng: -104.653175,
  };

  zoom = 12;

  constructor(
    private tiendasService: TiendasService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private googleMapsLoader: GoogleMapsLoaderService
  ) {}

  ngOnInit(): void {
    this.cargarTiendas();
  }

  ngAfterViewInit(): void {
    this.googleMapsLoader
      .load()
      .then(() => {
        this.ngZone.run(() => {
          this.mapaCargado = true;
          this.cdr.detectChanges();

          setTimeout(() => {
            this.inicializarAutocomplete();
          }, 100);
        });
      })
      .catch((error) => {
        console.error('Error cargando Google Maps:', error);

        this.ngZone.run(() => {
          this.mensajeBusqueda =
            'No se pudo cargar Google Maps. Revisa la API Key del backend.';
          this.cdr.detectChanges();
        });
      });
  }

  cargarTiendas(): void {
    this.tiendasService.getTiendas().subscribe({
      next: (tiendas) => {
        console.log('Tiendas cargadas:', tiendas);

        this.todasLasTiendas = tiendas;
        this.tiendas = [];

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error cargando tiendas:', error);

        this.mensajeBusqueda = 'No se pudieron cargar las tiendas.';
        this.cdr.detectChanges();
      },
    });
  }

  inicializarAutocomplete(intentos = 0): void {
    if (!this.searchInput) {
      return;
    }

    if (
      typeof google === 'undefined' ||
      !google.maps ||
      !google.maps.places
    ) {
      if (intentos < 20) {
        setTimeout(() => this.inicializarAutocomplete(intentos + 1), 300);
      } else {
        this.mensajeBusqueda =
          'Google Places no cargó correctamente. Revisa tu API Key y que Places API esté habilitada.';
        this.cdr.detectChanges();
      }

      return;
    }

    const durangoBounds = new google.maps.LatLngBounds(
      { lat: 23.90, lng: -104.80 },
      { lat: 24.15, lng: -104.50 }
    );

    const autocomplete = new google.maps.places.Autocomplete(
      this.searchInput.nativeElement,
      {
        bounds: durangoBounds,
        strictBounds: false,
        componentRestrictions: { country: 'mx' },
        fields: ['formatted_address', 'geometry', 'name'],
      }
    );

    autocomplete.addListener('place_changed', () => {
      this.ngZone.run(() => {
        const place = autocomplete.getPlace();

        if (!place.geometry || !place.geometry.location) {
          this.mensajeBusqueda =
            'Selecciona una sugerencia válida del buscador.';
          this.cdr.detectChanges();
          return;
        }

        if (this.todasLasTiendas.length === 0) {
          this.mensajeBusqueda = 'No hay sucursales registradas.';
          this.cdr.detectChanges();
          return;
        }

        const puntoUsuario: google.maps.LatLngLiteral = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };

        this.busqueda =
          place.formatted_address || place.name || this.busqueda;

        this.origenBusqueda = this.busqueda;
        this.mensajeBusqueda = '';

        this.cargandoBusqueda = false;
        this.cargandoUbicacion = false;

        this.center = puntoUsuario;
        this.zoom = 13;

        this.mostrarTiendasCercanas(puntoUsuario);

        this.mensajeBusqueda = `Mostrando tiendas cercanas a: ${this.busqueda}`;

        this.cdr.detectChanges();
      });
    });
  }

  buscarPorDireccion(): void {
    const textoBusqueda = this.busqueda.trim();

    if (!textoBusqueda) {
      this.mensajeBusqueda =
        'Introduce una colonia, calle, tienda o código postal.';
      this.cdr.detectChanges();
      return;
    }

    if (this.todasLasTiendas.length === 0) {
      this.mensajeBusqueda = 'No hay sucursales registradas.';
      this.cdr.detectChanges();
      return;
    }

    if (typeof google === 'undefined' || !google.maps) {
      this.mensajeBusqueda = 'Google Maps no está cargado correctamente.';
      this.cdr.detectChanges();
      return;
    }

    this.cargandoBusqueda = true;
    this.mensajeBusqueda = 'Buscando ubicación...';
    this.origenBusqueda = textoBusqueda;
    this.tiendas = [];
    this.tiendaSeleccionada = undefined;
    this.cdr.detectChanges();

    const geocoder = new google.maps.Geocoder();

    const durangoBounds = new google.maps.LatLngBounds(
      { lat: 23.90, lng: -104.80 },
      { lat: 24.15, lng: -104.50 }
    );

    geocoder.geocode(
      {
        address: `${textoBusqueda}, Durango, Dgo., México`,
        bounds: durangoBounds,
        region: 'mx',
      },
      (results, status) => {
        this.ngZone.run(() => {
          this.cargandoBusqueda = false;

          if (status !== 'OK' || !results || results.length === 0) {
            this.mensajeBusqueda =
              'No se encontró una ubicación con esa búsqueda. Intenta seleccionar una sugerencia.';
            this.cdr.detectChanges();
            return;
          }

          const location = results[0].geometry.location;

          const puntoUsuario: google.maps.LatLngLiteral = {
            lat: location.lat(),
            lng: location.lng(),
          };

          this.center = puntoUsuario;
          this.zoom = 13;

          this.mostrarTiendasCercanas(puntoUsuario);

          this.mensajeBusqueda = `Mostrando tiendas cercanas a: ${textoBusqueda}`;

          this.cdr.detectChanges();
        });
      }
    );
  }

  usarUbicacionActual(): void {
    console.log('Intentando obtener ubicación actual...');

    if (!navigator.geolocation) {
      this.mensajeBusqueda =
        'Tu navegador no permite obtener la ubicación actual.';
      this.cdr.detectChanges();
      return;
    }

    if (this.todasLasTiendas.length === 0) {
      this.mensajeBusqueda = 'No hay sucursales registradas.';
      this.cdr.detectChanges();
      return;
    }

    this.cargandoUbicacion = true;
    this.mensajeBusqueda = 'Obteniendo tu ubicación...';
    this.tiendas = [];
    this.tiendaSeleccionada = undefined;
    this.cdr.detectChanges();

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.ngZone.run(() => {
          console.log('Ubicación obtenida:', position.coords);

          const puntoUsuario: google.maps.LatLngLiteral = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          this.origenBusqueda = `${puntoUsuario.lat},${puntoUsuario.lng}`;

          this.center = puntoUsuario;
          this.zoom = 13;

          this.mostrarTiendasCercanas(puntoUsuario);

          this.cargandoUbicacion = false;
          this.mensajeBusqueda =
            'Mostrando tiendas cercanas a tu ubicación actual.';

          this.cdr.detectChanges();
        });
      },
      (error) => {
        this.ngZone.run(() => {
          console.error('Error obteniendo ubicación:', error);

          this.cargandoUbicacion = false;

          if (error.code === error.PERMISSION_DENIED) {
            this.mensajeBusqueda =
              'El navegador tiene bloqueada la ubicación para este sitio.';
            this.cdr.detectChanges();
            return;
          }

          if (error.code === error.POSITION_UNAVAILABLE) {
            this.mensajeBusqueda =
              'No se pudo detectar tu ubicación. Intenta buscar por colonia o código postal.';
            this.cdr.detectChanges();
            return;
          }

          if (error.code === error.TIMEOUT) {
            this.mensajeBusqueda =
              'La ubicación tardó demasiado. Intenta de nuevo o busca por colonia.';
            this.cdr.detectChanges();
            return;
          }

          this.mensajeBusqueda = 'No se pudo obtener tu ubicación.';
          this.cdr.detectChanges();
        });
      },
      {
        enableHighAccuracy: false,
        timeout: 3000,
        maximumAge: 600000,
      }
    );
  }

  private mostrarTiendasCercanas(
    puntoUsuario: google.maps.LatLngLiteral
  ): void {
    const tiendasOrdenadas = this.todasLasTiendas
      .filter((tienda) => tienda.lat !== null && tienda.lng !== null)
      .map((tienda) => ({
        ...tienda,
        distanciaKm: this.calcularDistanciaKm(
          puntoUsuario.lat,
          puntoUsuario.lng,
          Number(tienda.lat),
          Number(tienda.lng)
        ),
      }))
      .sort((a, b) => (a.distanciaKm || 0) - (b.distanciaKm || 0));

    this.tiendas = tiendasOrdenadas.slice(0, 3);

    if (this.tiendas.length > 0) {
      this.seleccionarTienda(this.tiendas[0]);
    } else {
      this.mensajeBusqueda = 'No se encontraron sucursales cercanas.';
    }

    this.cdr.detectChanges();
  }

  seleccionarTienda(tienda: TiendaConDistancia): void {
    this.tiendaSeleccionada = tienda;

    this.center = {
      lat: Number(tienda.lat),
      lng: Number(tienda.lng),
    };

    this.zoom = 16;

    this.cdr.detectChanges();
  }

  abrirRuta(tienda: TiendaConDistancia): void {
    const destino = `${tienda.lat},${tienda.lng}`;
    const origen = this.origenBusqueda ? this.origenBusqueda : '';

    const url = origen
      ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
          origen
        )}&destination=${encodeURIComponent(destino)}&travelmode=driving`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
          destino
        )}&travelmode=driving`;

    window.open(url, '_blank');
  }

  limpiarBusqueda(): void {
    this.busqueda = '';
    this.origenBusqueda = '';
    this.mensajeBusqueda = '';

    this.cargandoBusqueda = false;
    this.cargandoUbicacion = false;

    this.tiendas = [];
    this.tiendaSeleccionada = undefined;

    this.center = {
      lat: 24.02772,
      lng: -104.653175,
    };

    this.zoom = 12;

    this.cdr.detectChanges();
  }

  private calcularDistanciaKm(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const radioTierraKm = 6371;

    const dLat = this.gradosARadianes(lat2 - lat1);
    const dLng = this.gradosARadianes(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.gradosARadianes(lat1)) *
        Math.cos(this.gradosARadianes(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Number((radioTierraKm * c).toFixed(2));
  }

  private gradosARadianes(grados: number): number {
    return grados * (Math.PI / 180);
  }
}
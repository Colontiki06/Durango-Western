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
  @ViewChild('mapSection') mapSection?: ElementRef<HTMLElement>;

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
    if (typeof window === 'undefined') {
      return;
    }

    this.googleMapsLoader
      .load()
      .then(() => {
        this.ngZone.run(() => {
          if (
            typeof google === 'undefined' ||
            !google.maps ||
            !google.maps.places
          ) {
            this.mapaCargado = false;
            this.mensajeBusqueda =
              'Google Maps no terminó de cargar. Recarga la página.';
            this.cdr.detectChanges();
            return;
          }

          this.mapaCargado = true;
          this.cdr.detectChanges();

          setTimeout(() => {
            this.inicializarAutocomplete();
            window.dispatchEvent(new Event('resize'));
          }, 300);
        });
      })
      .catch((error) => {
        console.error('Error cargando Google Maps:', error);

        this.ngZone.run(() => {
          this.mapaCargado = false;
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

        this.todasLasTiendas = tiendas ?? [];
        this.tiendas = [];
        this.tiendaSeleccionada = undefined;

        this.cdr.detectChanges();

        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('resize'));
          }
        }, 300);
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

        this.mostrarTiendasCercanas(this.busqueda, puntoUsuario);

        this.mensajeBusqueda = `Mostrando tiendas cercanas a: ${this.busqueda}`;

        this.cdr.detectChanges();

        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
        }, 300);
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
          const direccionOrigen = results[0].formatted_address || textoBusqueda;

          const puntoUsuario: google.maps.LatLngLiteral = {
            lat: location.lat(),
            lng: location.lng(),
          };

          this.origenBusqueda = direccionOrigen;
          this.center = puntoUsuario;
          this.zoom = 13;

          this.mostrarTiendasCercanas(direccionOrigen, puntoUsuario);

          this.mensajeBusqueda = `Mostrando tiendas cercanas a: ${textoBusqueda}`;

          this.cdr.detectChanges();

          setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
          }, 300);
        });
      }
    );
  }

  usarUbicacionActual(): void {
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
        const lat = Number(position.coords.latitude);
        const lng = Number(position.coords.longitude);
        const precisionMetros = Math.round(position.coords.accuracy ?? 0);

        const puntoUsuario: google.maps.LatLngLiteral = { lat, lng };

        this.origenBusqueda = `${lat},${lng}`;

        if (typeof google !== 'undefined' && google.maps) {
          const geocoder = new google.maps.Geocoder();

          geocoder.geocode(
            {
              location: puntoUsuario,
              region: 'mx',
            },
            (results, status) => {
              this.ngZone.run(() => {
                if (status === 'OK' && results && results.length > 0) {
                  this.busqueda = results[0].formatted_address;
                } else {
                  this.busqueda = `${lat}, ${lng}`;
                }

                this.center = puntoUsuario;
                this.zoom = 10;

                this.mostrarTiendasCercanas(puntoUsuario, puntoUsuario);

                this.cargandoUbicacion = false;
                this.mensajeBusqueda =
                  `Mostrando tiendas cercanas a tu ubicación actual. Precisión aproximada: ${precisionMetros} m.`;

                this.cdr.detectChanges();

                setTimeout(() => {
                  window.dispatchEvent(new Event('resize'));
                }, 300);
              });
            }
          );
        } else {
          this.busqueda = `${lat}, ${lng}`;

          this.center = puntoUsuario;
          this.zoom = 10;

          this.mostrarTiendasCercanas(puntoUsuario, puntoUsuario);

          this.cargandoUbicacion = false;
          this.mensajeBusqueda =
            `Mostrando tiendas cercanas a tu ubicación actual. Precisión aproximada: ${precisionMetros} m.`;

          this.cdr.detectChanges();
        }
      });
    },
    (error) => {
      this.ngZone.run(() => {
        console.error('Error obteniendo ubicación:', error);

        this.cargandoUbicacion = false;
        this.mensajeBusqueda =
          'No se pudo obtener tu ubicación. Intenta buscar por código postal.';

        this.cdr.detectChanges();
      });
    },
    {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 0,
    }
  );
}

  private mostrarTiendasCercanas(
    origen: string | google.maps.LatLngLiteral,
    puntoUsuario: google.maps.LatLngLiteral
  ): void {
    const tiendasValidas = this.todasLasTiendas.filter(
      (tienda) => tienda.lat !== null && tienda.lng !== null
    );

    if (tiendasValidas.length === 0) {
      this.tiendas = [];
      this.tiendaSeleccionada = undefined;
      this.mensajeBusqueda = 'No se encontraron sucursales cercanas.';
      this.cdr.detectChanges();
      return;
    }

    if (typeof google === 'undefined' || !google.maps) {
      this.mostrarTiendasConDistanciaLineal(puntoUsuario, tiendasValidas);
      return;
    }

    const service = new google.maps.DistanceMatrixService();

    service.getDistanceMatrix(
      {
        origins: [origen],
        destinations: tiendasValidas.map((tienda) => ({
          lat: Number(tienda.lat),
          lng: Number(tienda.lng),
        })),
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
      },
      (response, status) => {
        this.ngZone.run(() => {
          if (status !== 'OK' || !response?.rows?.[0]?.elements) {
            this.mostrarTiendasConDistanciaLineal(puntoUsuario, tiendasValidas);
            return;
          }

          this.tiendas = tiendasValidas
            .map((tienda, index) => {
              const element = response.rows[0].elements[index];

              const distanciaKm =
                element.status === 'OK' && element.distance
                  ? Number((element.distance.value / 1000).toFixed(2))
                  : this.calcularDistanciaKm(
                      puntoUsuario.lat,
                      puntoUsuario.lng,
                      Number(tienda.lat),
                      Number(tienda.lng)
                    );

              return {
                ...tienda,
                distanciaKm,
              };
            })
            .sort(
              (a, b) =>
                Number(a.distanciaKm ?? 0) - Number(b.distanciaKm ?? 0)
            );

          if (this.tiendas.length > 0) {
            this.seleccionarTienda(this.tiendas[0], false);
          } else {
            this.mensajeBusqueda = 'No se encontraron sucursales cercanas.';
          }

          this.cdr.detectChanges();
        });
      }
    );
  }

  private mostrarTiendasConDistanciaLineal(
    puntoUsuario: google.maps.LatLngLiteral,
    tiendasValidas: Tienda[]
  ): void {
    this.tiendas = tiendasValidas
      .map((tienda) => ({
        ...tienda,
        distanciaKm: this.calcularDistanciaKm(
          puntoUsuario.lat,
          puntoUsuario.lng,
          Number(tienda.lat),
          Number(tienda.lng)
        ),
      }))
      .sort((a, b) => Number(a.distanciaKm ?? 0) - Number(b.distanciaKm ?? 0));

    if (this.tiendas.length > 0) {
      this.seleccionarTienda(this.tiendas[0], false);
    } else {
      this.mensajeBusqueda = 'No se encontraron sucursales cercanas.';
    }

    this.cdr.detectChanges();
  }

  seleccionarTienda(tienda: TiendaConDistancia, scrollMapa = true): void {
    this.tiendaSeleccionada = tienda;

    this.center = {
      lat: Number(tienda.lat),
      lng: Number(tienda.lng),
    };

    this.zoom = 16;

    this.cdr.detectChanges();

    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('resize'));

        if (scrollMapa) {
          this.mapSection?.nativeElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      }
    }, 300);
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

    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('resize'));
      }
    }, 300);
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
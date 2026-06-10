import {
  Component,
  ElementRef,
  ViewChild,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  NgZone
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart/cart.service';
import { ApiService } from '../../core/services/api/api.service';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css'
})
export class Inicio implements OnInit, OnDestroy {

  @ViewChild('categoriasCarousel')
  categoriasCarousel!: ElementRef<HTMLDivElement>;

  activeDot = 0;
  bannerActual = 0;
  intervaloBanner: any;

  tallaSeleccionada = '23';
  productoVista: any = null;

  categorias: any[] = [];
  banners: any[] = [];

  constructor(
    private cartService: CartService,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
  this.cargarPersonalizacionInicio();
}

  ngOnDestroy(): void {
    if (this.intervaloBanner) {
      clearInterval(this.intervaloBanner);
    }
  }

  cargarPersonalizacionInicio(): void {
    this.api.get<any>('personalizar-inicio').subscribe({
      next: (data) => {
        this.banners = (data.banners ?? [])
          .filter((banner: any) => banner.activo)
          .map((banner: any) => ({
            textoSuperior: banner.texto_superior ?? '',
            titulo: banner.titulo ?? '',
            descripcion: banner.descripcion ?? '',
            boton: banner.texto_boton ?? 'Ver colección',
            textoBoton: banner.texto_boton ?? 'Ver colección',
            enlaceBoton: banner.enlace_boton ?? '/productos',
            imagen: banner.imagen_url ?? '/img/banner.png'
          }));

        this.categorias = (data.categorias ?? [])
          .filter((categoria: any) => categoria.activa)
          .map((categoria: any) => ({
            nombre: categoria.nombre ?? '',
            imagen: categoria.imagen_url ?? '/img/Sombreros.png',
            ruta: categoria.enlace ?? '/productos'
          }));

        if (this.banners.length === 0) {
          this.banners = [
            {
              textoSuperior: 'NUEVA COLECCIÓN',
              titulo: 'Estilo western auténtico',
              descripcion: 'Primavera Verano 2026',
              boton: 'Ver colección',
              textoBoton: 'Ver colección',
              enlaceBoton: '/productos',
              imagen: '/img/banner.png'
            }
          ];
        }

        if (this.categorias.length === 0) {
          this.categorias = [
            { nombre: 'Botas Caballero', imagen: '/img/BotasCaballero.PNG', ruta: '/productos' },
            { nombre: 'Botas Dama', imagen: '/img/BotasDama.png', ruta: '/productos' },
            { nombre: 'Sombreros', imagen: '/img/Sombreros.png', ruta: '/productos' },
            { nombre: 'Camisas', imagen: '/img/Camisas.png', ruta: '/productos' }
          ];
        }

        this.iniciarCarruselBanner();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error cargando inicio personalizado:', error);

        this.banners = [
          {
            textoSuperior: 'NUEVA COLECCIÓN',
            titulo: 'Estilo western auténtico',
            descripcion: 'Primavera Verano 2026',
            boton: 'Ver colección',
            textoBoton: 'Ver colección',
            enlaceBoton: '/productos',
            imagen: '/img/banner.png'
          }
        ];

        this.categorias = [
          { nombre: 'Botas Caballero', imagen: '/img/BotasCaballero.PNG', ruta: '/productos' },
          { nombre: 'Botas Dama', imagen: '/img/BotasDama.png', ruta: '/productos' },
          { nombre: 'Sombreros', imagen: '/img/Sombreros.png', ruta: '/productos' },
          { nombre: 'Camisas', imagen: '/img/Camisas.png', ruta: '/productos' }
        ];

        this.iniciarCarruselBanner();
        this.cdr.detectChanges();
      }
    });
  }

  iniciarCarruselBanner(): void {
    if (this.intervaloBanner) {
      clearInterval(this.intervaloBanner);
    }

    if (this.banners.length <= 1) return;

    this.intervaloBanner = setInterval(() => {
      this.ngZone.run(() => {
        this.siguienteBanner();
        this.cdr.detectChanges();
      });
    }, 3000);
  }

  siguienteBanner(): void {
    if (this.banners.length === 0) return;
    this.bannerActual = (this.bannerActual + 1) % this.banners.length;
  }

  anteriorBanner(): void {
    if (this.banners.length === 0) return;

    this.bannerActual =
      this.bannerActual === 0
        ? this.banners.length - 1
        : this.bannerActual - 1;

    this.cdr.detectChanges();
  }

  scrollCategorias(direction: 'left' | 'right', event?: Event): void {
    event?.stopPropagation();

    const carousel = this.categoriasCarousel?.nativeElement;
    if (!carousel) return;

    carousel.scrollBy({
      left: direction === 'right' ? 320 : -320,
      behavior: 'smooth'
    });
  }

  abrirVista(producto: any): void {
    this.productoVista = producto;
    this.tallaSeleccionada = '23';
  }

  cerrarVista(): void {
    this.productoVista = null;
  }

  seleccionarTalla(talla: string): void {
    this.tallaSeleccionada = talla;
  }

  agregarProductoVista(): void {
    if (!this.productoVista) return;

    this.cartService.addToCart({
      id: this.productoVista.id,
      nombre: this.productoVista.nombre,
      precio: this.productoVista.precio,
      cantidad: 1,
      talla: this.tallaSeleccionada,
      imagen: this.productoVista.imagen
    });

    this.cerrarVista();
  }

  addToCart(product: {
    id: string;
    nombre: string;
    precio: number;
    imagen: string;
  }): void {
    this.cartService.addToCart({
      id: product.id,
      nombre: product.nombre,
      precio: product.precio,
      cantidad: 1,
      talla: 'Única',
      imagen: product.imagen
    });
  }

}
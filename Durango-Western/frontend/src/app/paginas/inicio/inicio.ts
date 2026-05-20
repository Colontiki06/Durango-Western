import {
  Component,
  ElementRef,
  ViewChild,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  NgZone
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css'
})
export class Inicio implements OnInit, OnDestroy {

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

  tallaSeleccionada = '23';

  seleccionarTalla(talla: string): void {
    this.tallaSeleccionada = talla;
  }

  productoVista: any = null;

  abrirVista(producto: any): void {
    this.productoVista = producto;
  }

  cerrarVista(): void {
    this.productoVista = null;
  }

  @ViewChild('categoriasCarousel')
  categoriasCarousel!: ElementRef<HTMLDivElement>;

  activeDot = 0;
  bannerActual = 0;
  intervaloBanner: any;

  categorias = [
    { nombre: 'Botas Caballero', imagen: '/img/BotasCaballero.PNG', ruta: '/productos/botas-caballero' },
    { nombre: 'Botas Dama', imagen: '/img/BotasDama.png', ruta: '/productos/botas-dama' },
    { nombre: 'Sombreros', imagen: '/img/Sombreros.png', ruta: '/productos/sombreros' },
    { nombre: 'Camisas', imagen: '/img/Camisas.png', ruta: '/productos/camisas' },
    { nombre: 'Cintos', imagen: '/img/Cintos.png', ruta: '/productos/cintos' },
    { nombre: 'Gorras', imagen: '/img/Gorras.PNG', ruta: '/productos/gorras' },
    { nombre: 'Accesorios', imagen: '/img/Accesorios.png', ruta: '/productos/accesorios' },
    { nombre: 'Pantalones', imagen: '/img/Pantalones.png', ruta: '/productos/pantalones' }
  ];

  banners = [
    {
      textoSuperior: 'NUEVA COLECCIÓN',
      titulo: 'Estilo western auténtico',
      descripcion: 'Primavera Verano 2026',
      boton: 'Ver colección',
      imagen: '/img/banner.png'
    },
    {
      textoSuperior: 'BOTAS PREMIUM',
      titulo: 'Diseño vaquero para todos',
      descripcion: 'Caballero y dama',
      boton: 'Comprar ahora',
      imagen: '/img/BotasCaballero.PNG'
    },
    {
      textoSuperior: 'NUEVOS LANZAMIENTOS',
      titulo: 'Sombreros y accesorios',
      descripcion: 'Colección western',
      boton: 'Explorar',
      imagen: '/img/Sombreros.png'
    }
  ];

  constructor(
  private cartService: CartService,
  private cdr: ChangeDetectorRef,
  private ngZone: NgZone
  ) {}

 ngOnInit(): void {
  this.intervaloBanner = setInterval(() => {
    this.ngZone.run(() => {
      this.siguienteBanner();
      this.cdr.detectChanges();
    });
  }, 3000);
}

 ngOnDestroy(): void {
  clearInterval(this.intervaloBanner);
}

  siguienteBanner(): void {
  this.bannerActual = (this.bannerActual + 1) % this.banners.length;
}

  anteriorBanner(): void {
    this.bannerActual =
      this.bannerActual === 0
        ? this.banners.length - 1
        : this.bannerActual - 1;

    this.cdr.detectChanges();
  }

  scrollCategorias(direction: 'left' | 'right', event?: Event): void {

  event?.stopPropagation();

  const carousel = this.categoriasCarousel.nativeElement;

  carousel.scrollBy({
    left: direction === 'right' ? 320 : -320,
    behavior: 'smooth'
  });

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
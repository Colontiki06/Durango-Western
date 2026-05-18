import { Component, ElementRef, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css'
})
export class Inicio {

  @ViewChild('categoriasCarousel')
  categoriasCarousel!: ElementRef<HTMLDivElement>;

  activeDot = 0;

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

  bannerActual = 0;

  constructor(private cartService: CartService) {}

  siguienteBanner(): void {
    this.bannerActual =
      (this.bannerActual + 1) % this.banners.length;
  }

  anteriorBanner(): void {
    this.bannerActual =
      this.bannerActual === 0
        ? this.banners.length - 1
        : this.bannerActual - 1;
  }

  scrollCategorias(direction: 'left' | 'right'): void {

    const carousel = this.categoriasCarousel.nativeElement;

    const scrollAmount = 280;

    carousel.scrollBy({
      left: direction === 'right'
        ? scrollAmount
        : -scrollAmount,
      behavior: 'smooth'
    });

    this.updateActiveDot(direction);
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

  private updateActiveDot(direction: 'left' | 'right'): void {

    const totalDots = 4;

    if (direction === 'right') {

      this.activeDot =
        this.activeDot === totalDots - 1
          ? 0
          : this.activeDot + 1;

    } else {

      this.activeDot =
        this.activeDot === 0
          ? totalDots - 1
          : this.activeDot - 1;

    }

  }

}
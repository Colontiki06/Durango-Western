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

  constructor(private cartService: CartService) {}

  scrollCategorias(direction: 'left' | 'right'): void {
    const carousel = this.categoriasCarousel.nativeElement;
    const scrollAmount = 280;

    carousel.scrollBy({
      left: direction === 'right' ? scrollAmount : -scrollAmount,
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
      this.activeDot = this.activeDot === totalDots - 1 ? 0 : this.activeDot + 1;
    } else {
      this.activeDot = this.activeDot === 0 ? totalDots - 1 : this.activeDot - 1;
    }
  }
}
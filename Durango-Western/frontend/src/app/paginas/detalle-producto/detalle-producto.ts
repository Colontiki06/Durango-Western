import { Component } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-detalle-producto',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './detalle-producto.html',
  styleUrl: './detalle-producto.css'
})
export class DetalleProducto {
  slug: string | null = null;

  producto = {
    id: 'producto-demo',
    nombre: 'Producto western',
    precio: 1999,
    descripcion: 'Producto estilo western de alta calidad.',
    imagenPrincipal: '/img/producto-demo.jpg',
    imagenes: [
      '/img/producto-demo.jpg',
      '/img/producto-demo.jpg',
      '/img/producto-demo.jpg'
    ]
  };

  tallas = ['25', '26', '27', '28', '29', '30'];

  selectedSize = '27';

  relacionados = [
    {
      nombre: 'Bota western clásica',
      precio: 1899,
      imagen: '/img/producto-demo.jpg'
    },
    {
      nombre: 'Sombrero vaquero',
      precio: 899,
      imagen: '/img/producto-demo.jpg'
    },
    {
      nombre: 'Camisa western',
      precio: 699,
      imagen: '/img/producto-demo.jpg'
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private cartService: CartService
  ) {
    this.slug = this.route.snapshot.paramMap.get('slug');

    if (this.slug) {
      this.producto.id = this.slug;
    }
  }

  seleccionarTalla(talla: string): void {
    this.selectedSize = talla;
  }

  addToCart(): void {
    this.cartService.addToCart({
      id: this.producto.id,
      nombre: this.producto.nombre,
      precio: this.producto.precio,
      cantidad: 1,
      talla: this.selectedSize,
      imagen: this.producto.imagenPrincipal
    });
  }
}
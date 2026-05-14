import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-detalle-producto',
  imports: [],
  templateUrl: './detalle-producto.html',
  styleUrl: './detalle-producto.css'
})
export class DetalleProducto {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cartService = inject(CartService);

  slug = this.route.snapshot.paramMap.get('slug');

  tallas = ['25', '25.5', '26', '26.5', '27', '27.5', '28', '29'];

  relacionados = Array(4).fill({});

  selectedSize = '26';

  addToCart(): void {
    this.cartService.addToCart({
      id: this.slug ?? 'producto-demo',
      nombre: 'Producto próximamente',
      precio: 0,
      talla: this.selectedSize,
      cantidad: 1
    });

    this.router.navigate(['/carrito']);
  }

}
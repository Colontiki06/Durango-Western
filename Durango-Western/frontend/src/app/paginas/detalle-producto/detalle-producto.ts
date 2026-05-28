import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';

import { CartService } from '../../core/services/cart/cart.service';
import { ApiService } from '../../core/services/api/api.service';

type ProductoState = {
  loading: boolean;
  error: string;
  producto: any | null;
};

@Component({
  selector: 'app-detalle-producto',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './detalle-producto.html',
  styleUrl: './detalle-producto.css'
})
export class DetalleProducto implements OnInit {

  productoState$!: Observable<ProductoState>;

  tallas = ['25', '26', '27', '28', '29', '30'];
  selectedSize = '27';

  constructor(
    private route: ActivatedRoute,
    private cartService: CartService,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.productoState$ = this.route.paramMap.pipe(
      switchMap(params => {
        const slug = params.get('slug');

        if (!slug) {
          return of({
            loading: false,
            error: 'Producto no encontrado',
            producto: null
          });
        }

        return this.api.get<any>(`productos/slug/${slug}`).pipe(
          map(producto => ({
            loading: false,
            error: '',
            producto
          })),
          startWith({
            loading: true,
            error: '',
            producto: null
          }),
          catchError(() =>
            of({
              loading: false,
              error: 'No se pudo cargar el producto',
              producto: null
            })
          )
        );
      })
    );
  }

  imagenPrincipal(producto: any): string {
    return producto?.producto_imagenes?.[0]?.imagen_url || 'https://placehold.co/800x800';
  }

  seleccionarTalla(talla: string): void {
    this.selectedSize = talla;
  }

  addToCart(producto: any): void {
    if (!producto) return;

    this.cartService.addToCart({
      id: producto.id,
      nombre: producto.nombre,
      precio: Number(producto.precio),
      cantidad: 1,
      talla: this.selectedSize,
      imagen: this.imagenPrincipal(producto)
    });
  }
}
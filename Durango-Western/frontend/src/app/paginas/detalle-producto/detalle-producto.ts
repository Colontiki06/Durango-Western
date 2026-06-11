import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';

import { CartService } from '../../core/services/cart/cart.service';
import { ApiService } from '../../core/services/api/api.service';

type ProductoState = {
  loading: boolean;
  error: string;
  producto: any | null;
  relacionados: any[];
};

@Component({
  selector: 'app-detalle-producto',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RouterLink],
  templateUrl: './detalle-producto.html',
  styleUrl: './detalle-producto.css',
})
export class DetalleProducto implements OnInit {
  productoState$!: Observable<ProductoState>;

  selectedVariant: any = null;
  selectedImage: string | null = null;

  acordeonProductoAbierto = false;
  acordeonEnviosAbierto = false;

  mensajeCarrito = '';

  constructor(
    private route: ActivatedRoute,
    private cartService: CartService,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.productoState$ = this.route.paramMap.pipe(
      switchMap((params) => {
        const slug = params.get('slug');

        this.selectedVariant = null;
        this.selectedImage = null;
        this.acordeonProductoAbierto = false;
        this.acordeonEnviosAbierto = false;
        this.mensajeCarrito = '';

        if (!slug) {
          return of({
            loading: false,
            error: 'Producto no encontrado',
            producto: null,
            relacionados: [],
          });
        }

        return this.api.get<any>(`productos/slug/${slug}`).pipe(
          switchMap((producto) => {
            if (!producto) {
              return of({
                loading: false,
                error: 'Producto no encontrado',
                producto: null,
                relacionados: [],
              });
            }

            return forkJoin({
              producto: of(producto),
              relacionados: this.api
                .get<any[]>(`productos/${producto.id}/relacionados`)
                .pipe(catchError(() => of([]))),
            }).pipe(
              map(({ producto, relacionados }) => ({
                loading: false,
                error: '',
                producto,
                relacionados: relacionados || [],
              }))
            );
          }),
          startWith({
            loading: true,
            error: '',
            producto: null,
            relacionados: [],
          }),
          catchError(() =>
            of({
              loading: false,
              error: 'No se pudo cargar el producto',
              producto: null,
              relacionados: [],
            })
          )
        );
      })
    );
  }

  imagenPrincipal(producto: any): string {
    if (this.selectedImage) {
      return this.selectedImage;
    }

    const imagenPrincipal = producto?.producto_imagenes?.find(
      (img: any) => img.principal
    );

    return (
      imagenPrincipal?.imagen_url ||
      producto?.producto_imagenes?.[0]?.imagen_url ||
      'https://placehold.co/900x900?text=Durango+Western'
    );
  }

  imagenProducto(producto: any): string {
    return (
      producto?.producto_imagenes?.[0]?.imagen_url ||
      'https://placehold.co/600x600?text=Durango+Western'
    );
  }

  seleccionarImagen(url: string): void {
    this.selectedImage = url;
  }

  variantesDisponibles(producto: any): any[] {
    return producto?.producto_variantes ?? [];
  }

  seleccionarVariante(variante: any): void {
    if (!variante || variante.stock <= 0) {
      return;
    }

    this.selectedVariant = variante;
    this.mensajeCarrito = '';
  }

  stockTotal(producto: any): number {
    const variantes = this.variantesDisponibles(producto);

    if (!variantes.length) {
      return Number(producto?.stock ?? 0);
    }

    return variantes.reduce(
      (total, variante) => total + Number(variante.stock ?? 0),
      0
    );
  }

  precioProducto(producto: any): number {
    return Number(producto?.precio ?? 0) + Number(this.selectedVariant?.precio_extra ?? 0);
  }

  addToCart(producto: any): void {
    if (!producto) {
      return;
    }

    this.mensajeCarrito = '';

    const variantes = this.variantesDisponibles(producto);

    if (variantes.length > 0 && !this.selectedVariant) {
      this.mensajeCarrito = 'Selecciona una talla antes de agregar al carrito.';
      return;
    }

    if (this.stockTotal(producto) <= 0) {
      this.mensajeCarrito = 'Este producto está agotado.';
      return;
    }

    this.cartService.addToCart({
      id: producto.id,
      producto_id: producto.id,
      variante_id: this.selectedVariant?.id ?? null,
      codigo: this.selectedVariant?.sku ?? producto.codigo ?? '',
      nombre: producto.nombre,
      precio: this.precioProducto(producto),
      cantidad: 1,
      talla: this.selectedVariant?.tallas?.nombre ?? null,
      stock: Number(this.selectedVariant?.stock ?? this.stockTotal(producto)),
      imagen: this.imagenPrincipal(producto),
    });

    this.mensajeCarrito = 'Producto agregado al carrito.';
  }

  imagenesProducto(producto: any): any[] {
    return [...(producto?.producto_imagenes ?? [])].sort((a: any, b: any) => {
      if (a.principal && !b.principal) return -1;
      if (!a.principal && b.principal) return 1;
      return (a.orden ?? 0) - (b.orden ?? 0);
    });
  }

  toggleAcordeonProducto(): void {
    this.acordeonProductoAbierto = !this.acordeonProductoAbierto;
  }

  toggleAcordeonEnvios(): void {
    this.acordeonEnviosAbierto = !this.acordeonEnviosAbierto;
  }

  nombreTalla(variante: any): string {
    return variante?.tallas?.nombre || 'Unitalla';
  }

  tieneVariantes(producto: any): boolean {
    return this.variantesDisponibles(producto).length > 0;
  }
}
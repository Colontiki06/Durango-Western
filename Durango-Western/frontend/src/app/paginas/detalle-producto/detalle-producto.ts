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
  styleUrl: './detalle-producto.css'
})
export class DetalleProducto implements OnInit {

  productoState$!: Observable<ProductoState>;

  selectedVariant: any = null;
  selectedImage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private cartService: CartService,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.productoState$ = this.route.paramMap.pipe(
      switchMap(params => {
        const slug = params.get('slug');

        this.selectedVariant = null;
        this.selectedImage = null;

        if (!slug) {
          return of({
            loading: false,
            error: 'Producto no encontrado',
            producto: null,
            relacionados: []
          });
        }

        return this.api.get<any>(`productos/slug/${slug}`).pipe(
          switchMap(producto => {
            if (!producto) {
              return of({
                loading: false,
                error: 'Producto no encontrado',
                producto: null,
                relacionados: []
              });
            }

            return forkJoin({
              producto: of(producto),
              relacionados: this.api.get<any[]>(`productos/${producto.id}/relacionados`)
            }).pipe(
              map(({ producto, relacionados }) => ({
                loading: false,
                error: '',
                producto,
                relacionados
              }))
            );
          }),
          startWith({
            loading: true,
            error: '',
            producto: null,
            relacionados: []
          }),
          catchError(() =>
            of({
              loading: false,
              error: 'No se pudo cargar el producto',
              producto: null,
              relacionados: []
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

  return imagenPrincipal?.imagen_url
    || producto?.producto_imagenes?.[0]?.imagen_url
    || 'https://placehold.co/800x800';
}

  imagenProducto(producto: any): string {
    return producto?.producto_imagenes?.[0]?.imagen_url || 'https://placehold.co/600x600';
  }

  seleccionarImagen(url: string): void {
    this.selectedImage = url;
  }

  variantesDisponibles(producto: any): any[] {
    return producto?.producto_variantes ?? [];
  }

  seleccionarVariante(variante: any): void {
    if (!variante || variante.stock <= 0) return;
    this.selectedVariant = variante;
  }

  stockTotal(producto: any): number {
    const variantes = this.variantesDisponibles(producto);
    if (!variantes.length) return 0;

    return variantes.reduce((total, variante) => total + (variante.stock ?? 0), 0);
  }

  addToCart(producto: any): void {
    if (!producto) return;

    const variantes = this.variantesDisponibles(producto);

    if (variantes.length > 0 && !this.selectedVariant) {
      alert('Selecciona una talla antes de agregar al carrito');
      return;
    }

    this.cartService.addToCart({
      id: producto.id,
      nombre: producto.nombre,
      precio: Number(producto.precio) + Number(this.selectedVariant?.precio_extra ?? 0),
      cantidad: 1,
      talla: this.selectedVariant?.tallas?.nombre ?? null,
      imagen: this.imagenPrincipal(producto)
    });
  }

  imagenesProducto(producto: any): any[] {
  return [...(producto?.producto_imagenes ?? [])].sort((a: any, b: any) => {
    if (a.principal && !b.principal) return -1;
    if (!a.principal && b.principal) return 1;
    return (a.orden ?? 0) - (b.orden ?? 0);
  });
}

}
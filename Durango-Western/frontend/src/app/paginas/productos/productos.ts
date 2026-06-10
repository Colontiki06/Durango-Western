import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { switchMap } from 'rxjs';

import { ApiService } from '../../core/services/api/api.service';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './productos.html',
  styleUrl: './productos.css'
})
export class Productos implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  genero = '';
  tipo = '';
  talla = '';

  precioMinimo = 0;
  precioMaximo = 10000;

  precioMin = 0;
  precioMax = 10000;

  products: any[] = [];

  ngOnInit(): void {
    this.route.queryParams
      .pipe(
        switchMap(params => {
          this.genero = params['genero'] ?? '';
          this.tipo = params['tipo'] ?? '';
          this.talla = params['talla'] ?? '';

          this.precioMin = Number(params['precioMin'] ?? this.precioMinimo);
          this.precioMax = Number(params['precioMax'] ?? this.precioMaximo);

          const filtros = {
            genero: this.genero,
            tipo: this.tipo,
            talla: this.talla,
            precioMin: this.precioMin,
            precioMax: this.precioMax
          };

          return this.api.get<any[]>('productos', filtros);
        })
      )
      .subscribe({
        next: (data) => {
          this.products = [...data];
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error cargando productos', error);
        }
      });
  }

  filtrar(clave: string, valor: string): void {
    const queryParams: any = {
      ...this.route.snapshot.queryParams
    };

    queryParams[clave] = valor;

    if (clave === 'tipo') {
      delete queryParams['talla'];
    }

    delete queryParams['categoria'];

    this.router.navigate(['/productos'], {
      queryParams
    });
  }

  actualizarPrecio(): void {
    this.precioMin = Number(this.precioMin);
    this.precioMax = Number(this.precioMax);

    if (this.precioMin < this.precioMinimo) {
      this.precioMin = this.precioMinimo;
    }

    if (this.precioMax > this.precioMaximo) {
      this.precioMax = this.precioMaximo;
    }

    if (this.precioMin > this.precioMax) {
      this.precioMin = this.precioMax;
    }

    const queryParams: any = {
      ...this.route.snapshot.queryParams,
      precioMin: this.precioMin,
      precioMax: this.precioMax
    };

    delete queryParams['precio'];
    delete queryParams['categoria'];

    this.router.navigate(['/productos'], {
      queryParams
    });
  }

  get porcentajeMin(): number {
    return (
      ((this.precioMin - this.precioMinimo) /
        (this.precioMaximo - this.precioMinimo)) *
      100
    );
  }

  get porcentajeMax(): number {
    return (
      ((this.precioMax - this.precioMinimo) /
        (this.precioMaximo - this.precioMinimo)) *
      100
    );
  }

  limpiarFiltros(): void {
    this.router.navigate(['/productos']);
  }

  get tallasDisponibles(): string[] {
    const tallasPorTipo: Record<string, string[]> = {
      botas: ['25', '26', '27', '28', '29', '30'],
      sombreros: ['6 7/8', '7', '7 1/4', '7 3/8', '7 1/2'],
      camisas: ['S', 'M', 'L', 'XL'],
      pantalones: ['28', '30', '32', '34', '36', '38'],
      cintos: ['36', '38', '40', '42'],
      bolsos: ['Unitalla']
    };

    return tallasPorTipo[this.tipo] ?? ['25', '26', '27', '28', '29', '30'];
  }

  imagenProducto(producto: any): string {
    const imagenPrincipal = producto?.producto_imagenes?.find(
      (img: any) => img.principal
    );

    return (
      imagenPrincipal?.imagen_url ||
      producto?.producto_imagenes?.[0]?.imagen_url ||
      'https://placehold.co/600x600'
    );
  }

  get tituloCategoria(): string {
    if (this.genero && this.tipo) {
      return `${this.nombreFiltro(this.tipo)} de ${this.nombreFiltro(this.genero)}`;
    }

    if (this.tipo) {
      return this.nombreFiltro(this.tipo);
    }

    if (this.genero) {
      return this.nombreFiltro(this.genero);
    }

    return 'Todos los productos';
  }

  nombreFiltro(valor: string): string {
    const titulos: Record<string, string> = {
      botas: 'Botas',
      sombreros: 'Sombreros',
      camisas: 'Camisas',
      pantalones: 'Pantalones',
      cintos: 'Cintos',
      bolsos: 'Bolsos',
      accesorios: 'Accesorios',
      caballero: 'Caballero',
      dama: 'Dama',
      ninos: 'Niños'
    };

    return titulos[valor] ?? valor;
  }
}
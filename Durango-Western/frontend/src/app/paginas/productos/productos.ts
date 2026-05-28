import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { ApiService } from '../../core/services/api/api.service';

@Component({
  selector: 'app-productos',
  imports: [CommonModule, RouterLink],
  templateUrl: './productos.html',
  styleUrl: './productos.css'
})
export class Productos implements OnInit {

  private route = inject(ActivatedRoute);
  private api = inject(ApiService);

  categoria = this.route.snapshot.paramMap.get('categoria') ?? 'todos';

  products: any[] = [];

  ngOnInit(): void {
    this.obtenerProductos();
  }

  obtenerProductos(): void {

    this.api.get<any[]>('productos')
      .subscribe({

        next: (data) => {

          this.products = data;

          console.log('Productos:', data);
        },

        error: (error) => {
          console.error('Error cargando productos', error);
        }

      });
  }

  get tituloCategoria(): string {

    const titulos: Record<string, string> = {
      'botas-caballero': 'Botas de Caballero',
      'botas-dama': 'Botas de Dama',
      'sombreros': 'Sombreros',
      'camisas': 'Camisas',
      'pantalones': 'Pantalones',
      'todos': 'Todos los productos'
    };

    return titulos[this.categoria] ?? 'Productos';
  }

}
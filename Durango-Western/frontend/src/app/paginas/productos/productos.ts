import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-productos',
  imports: [RouterLink],
  templateUrl: './productos.html',
  styleUrl: './productos.css'
})
export class Productos {

  private route = inject(ActivatedRoute);

  categoria = this.route.snapshot.paramMap.get('categoria') ?? 'todos';

  products = Array(12).fill({});

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
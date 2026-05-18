import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.css'
})
export class Pedidos {

  pedidos = [
    {
      id: 'DW-0001',
      fecha: '18 mayo 2026',
      estado: 'En camino',
      producto: 'Bota Durango Rugged Pro',
      talla: '28',
      total: 2399,
      imagen: '/img/BotasCaballero.PNG'
    },
    {
      id: 'DW-0002',
      fecha: '14 mayo 2026',
      estado: 'Entregado',
      producto: 'Sombrero Durango Western Premium',
      talla: 'Única',
      total: 1499,
      imagen: '/img/Sombreros.png'
    }
  ];

}
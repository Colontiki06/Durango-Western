import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-pedidos',
  imports: [RouterLink],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.css'
})
export class Pedidos {

  pedidos = Array(8).fill({});

}
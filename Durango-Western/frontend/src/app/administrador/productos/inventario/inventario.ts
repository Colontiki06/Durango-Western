import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-inventario',
  imports: [RouterLink],
  templateUrl: './inventario.html',
  styleUrl: './inventario.css'
})
export class Inventario {
  productos = Array(8).fill({});
}
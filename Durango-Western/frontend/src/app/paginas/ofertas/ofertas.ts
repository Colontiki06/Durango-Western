import { Component } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-ofertas',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  templateUrl: './ofertas.html',
  styleUrl: './ofertas.css'
})
export class Ofertas {

  productos50 = [
    { nombre: 'Bota Durango Clásica Ranch', precioOriginal: 4398, precioOferta: 2199, imagen: '/img/BotasCaballero.PNG', slug: 'bota-durango-ranch' },
    { nombre: 'Sombrero Durango Premium', precioOriginal: 2998, precioOferta: 1499, imagen: '/img/Sombreros.png', slug: 'sombrero-durango-premium' },
    { nombre: 'Cinto Western Negro', precioOriginal: 1198, precioOferta: 599, imagen: '/img/Cintos.png', slug: 'cinto-western-negro' }
  ];

  msi = [
    { nombre: 'Bota Durango Floral Sierra', precioOriginal: 2499, precioOferta: 2499, imagen: '/img/BotasDama.png', slug: 'bota-durango-floral' },
    { nombre: 'Cinto Western Premium', precioOriginal: 899, precioOferta: 899, imagen: '/img/Cintos.png', slug: 'cinto-western-premium' },
    { nombre: 'Camisa Western Negra', precioOriginal: 1299, precioOferta: 1299, imagen: '/img/Camisas.png', slug: 'camisa-western-negra' }
  ];

  ultimasPiezas = [
    { nombre: 'Gorra Stetson Western', precioOriginal: 799, precioOferta: 599, imagen: '/img/Gorras.PNG', slug: 'gorra-stetson-western' },
    { nombre: 'Pantalón Mezclilla Western', precioOriginal: 1199, precioOferta: 899, imagen: '/img/Pantalones.png', slug: 'pantalon-mezclilla-western' },
    { nombre: 'Accesorio Navaja Roja', precioOriginal: 699, precioOferta: 499, imagen: '/img/Accesorios.png', slug: 'accesorio-navaja-roja' }
  ];

  masVendidos = [
    { nombre: 'Bota Durango Rugged Pro', precioOriginal: 2999, precioOferta: 2399, imagen: '/img/BotasCaballero.PNG', slug: 'bota-rugged-pro' },
    { nombre: 'Sombrero Arena Western', precioOriginal: 1699, precioOferta: 1299, imagen: '/img/Sombreros.png', slug: 'sombrero-arena-western' },
    { nombre: 'Camisa Negra Premium', precioOriginal: 1399, precioOferta: 1099, imagen: '/img/Camisas.png', slug: 'camisa-negra-premium' }
  ];

}
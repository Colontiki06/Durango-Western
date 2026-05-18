import { Component } from '@angular/core';

@Component({
  selector: 'app-personalizar-inicio',
  imports: [],
  templateUrl: './personalizar-inicio.html',
  styleUrl: './personalizar-inicio.css'
})
export class PersonalizarInicio {

  banners = [
    {
      textoSuperior: 'NUEVA COLECCIÓN',
      titulo: 'Estilo western auténtico',
      descripcion: 'Primavera Verano 2026',
      imagen: '/img/banner.png',
      activo: true
    },
    {
      textoSuperior: 'BOTAS PREMIUM',
      titulo: 'Diseño vaquero para todos',
      descripcion: 'Caballero y dama',
      imagen: '/img/BotasCaballero.PNG',
      activo: true
    },
    {
      textoSuperior: 'NUEVOS LANZAMIENTOS',
      titulo: 'Sombreros y accesorios',
      descripcion: 'Colección western',
      imagen: '/img/Sombreros.png',
      activo: false
    }
  ];

  categorias = [
  {
    nombre: 'Botas Caballero',
    imagen: '/img/BotasCaballero.PNG'
  },
  {
    nombre: 'Botas Dama',
    imagen: '/img/BotasDama.png'
  },
  {
    nombre: 'Sombreros',
    imagen: '/img/Sombreros.png'
  },
  {
    nombre: 'Camisas',
    imagen: '/img/Camisas.png'
  },
  {
    nombre: 'Cintos',
    imagen: '/img/Cintos.png'
  },
  {
    nombre: 'Gorras',
    imagen: '/img/Gorras.PNG'
  },
  {
    nombre: 'Accesorios',
    imagen: '/img/Accesorios.png'
  },
  {
    nombre: 'Pantalones',
    imagen: '/img/Pantalones.png'
  }
];

}
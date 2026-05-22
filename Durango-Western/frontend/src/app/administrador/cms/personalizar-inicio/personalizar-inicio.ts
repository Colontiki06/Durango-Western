import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-personalizar-inicio',
  imports: [FormsModule],
  templateUrl: './personalizar-inicio.html',
  styleUrl: './personalizar-inicio.css'
})
export class PersonalizarInicio {

  showAddBannerModal = false;

  nuevoBanner = {
  textoSuperior: '',
  titulo: '',
  descripcion: '',
  imagen: '/img/Sombreros.png',
  textoBoton: 'Ver colección',
  enlaceBoton: '/productos',
  activo: true
};

  banners = [
  {
    textoSuperior: 'NUEVA COLECCIÓN',
    titulo: 'Estilo western auténtico',
    descripcion: 'Primavera Verano 2026',
    imagen: '/img/banner.png',
    textoBoton: 'Ver colección',
    enlaceBoton: '/productos/dama',
    activo: true
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

  abrirModalBanner(): void {
    this.showAddBannerModal = true;
  }

  cerrarModalBanner(): void {
    this.showAddBannerModal = false;

    this.nuevoBanner = {
  textoSuperior: '',
  titulo: '',
  descripcion: '',
  imagen: '/img/banner.png',
  textoBoton: 'Ver colección',
  enlaceBoton: '/productos',
  activo: true
};
  }

  agregarBanner(): void {
    if (!this.nuevoBanner.titulo.trim()) {
      return;
    }

    this.banners.push({ ...this.nuevoBanner });
    this.cerrarModalBanner();
  }

  eliminarBanner(index: number): void {
    this.banners.splice(index, 1);
  }

}
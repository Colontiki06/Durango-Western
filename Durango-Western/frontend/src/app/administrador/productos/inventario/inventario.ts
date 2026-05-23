import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

type FiltroInventario = 'todos' | 'promociones' | 'msi' | 'ultimas' | 'sin-stock';

interface ProductoInventario {
  id: string;
  nombre: string;
  sku: string;
  categoria: string;
  precio: number;
  stock: number;
  estado: 'Activo' | 'Oculto';
  imagen: string;
  promocionActiva: boolean;
  porcentajeDescuento: number;
  msiActivo: boolean;
  mesesMsi: number;
  ultimasPiezas: boolean;
}

@Component({
  selector: 'app-inventario',
  imports: [RouterLink],
  templateUrl: './inventario.html',
  styleUrl: './inventario.css'
})
export class Inventario {

  filtroActivo: FiltroInventario = 'todos';

  productos: ProductoInventario[] = [
    {
      id: 'bota-ranch',
      nombre: 'Bota Durango Clásica Ranch',
      sku: 'DW-0001',
      categoria: 'Botas',
      precio: 2399,
      stock: 14,
      estado: 'Activo',
      imagen: '/img/BotasCaballero.PNG',
      promocionActiva: true,
      porcentajeDescuento: 50,
      msiActivo: false,
      mesesMsi: 0,
      ultimasPiezas: false
    },
    {
      id: 'sombrero-premium',
      nombre: 'Sombrero Durango Premium',
      sku: 'DW-0002',
      categoria: 'Sombreros',
      precio: 1499,
      stock: 8,
      estado: 'Activo',
      imagen: '/img/Sombreros.png',
      promocionActiva: true,
      porcentajeDescuento: 30,
      msiActivo: true,
      mesesMsi: 6,
      ultimasPiezas: false
    },
    {
      id: 'camisa-western',
      nombre: 'Camisa Western Negra',
      sku: 'DW-0003',
      categoria: 'Camisas',
      precio: 1299,
      stock: 3,
      estado: 'Activo',
      imagen: '/img/Camisas.png',
      promocionActiva: false,
      porcentajeDescuento: 0,
      msiActivo: true,
      mesesMsi: 6,
      ultimasPiezas: true
    },
    {
      id: 'cinto-premium',
      nombre: 'Cinto Western Premium',
      sku: 'DW-0004',
      categoria: 'Cintos',
      precio: 899,
      stock: 0,
      estado: 'Activo',
      imagen: '/img/Cintos.png',
      promocionActiva: false,
      porcentajeDescuento: 0,
      msiActivo: false,
      mesesMsi: 0,
      ultimasPiezas: false
    }
  ];

  setFiltro(filtro: FiltroInventario): void {
    this.filtroActivo = filtro;
  }

  get productosFiltrados(): ProductoInventario[] {
    if (this.filtroActivo === 'promociones') {
      return this.productos.filter(producto => producto.promocionActiva);
    }

    if (this.filtroActivo === 'msi') {
      return this.productos.filter(producto => producto.msiActivo);
    }

    if (this.filtroActivo === 'ultimas') {
      return this.productos.filter(producto => producto.ultimasPiezas);
    }

    if (this.filtroActivo === 'sin-stock') {
      return this.productos.filter(producto => producto.stock === 0);
    }

    return this.productos;
  }

  get totalPromociones(): number {
    return this.productos.filter(producto => producto.promocionActiva).length;
  }

  get totalMsi(): number {
    return this.productos.filter(producto => producto.msiActivo).length;
  }

  get totalUltimasPiezas(): number {
    return this.productos.filter(producto => producto.ultimasPiezas).length;
  }

  get totalSinStock(): number {
    return this.productos.filter(producto => producto.stock === 0).length;
  }

}
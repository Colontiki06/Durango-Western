import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../../../core/services/api/api.service';

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
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './inventario.html',
  styleUrl: './inventario.css'
})
export class Inventario implements OnInit {

  private api = inject(ApiService);

  filtroActivo: FiltroInventario = 'todos';

  loading = true;
  error = '';

  busqueda = '';
  categoriaSeleccionada = 'todas';

  productos: ProductoInventario[] = [];

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.loading = true;
    this.error = '';

    this.api.get<any[]>('productos').subscribe({
      next: (data) => {
        this.productos = data.map(producto => this.mapearProducto(producto));
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando inventario:', error);
        this.error = 'No se pudo cargar el inventario';
        this.loading = false;
      }
    });
  }

  mapearProducto(producto: any): ProductoInventario {
    const stockTotal = (producto.producto_variantes ?? [])
      .reduce((total: number, variante: any) => total + Number(variante.stock ?? 0), 0);

    return {
      id: producto.id,
      nombre: producto.nombre,
      sku: producto.codigo ?? 'SIN-SKU',
      categoria: producto.categorias?.nombre ?? 'Sin categoría',
      precio: Number(producto.precio ?? 0),
      stock: stockTotal,
      estado: producto.activo ? 'Activo' : 'Oculto',
      imagen: producto.producto_imagenes?.[0]?.imagen_url || 'https://placehold.co/200x200',
      promocionActiva: false,
      porcentajeDescuento: 0,
      msiActivo: false,
      mesesMsi: 0,
      ultimasPiezas: stockTotal > 0 && stockTotal <= 5
    };
  }

  setFiltro(filtro: FiltroInventario): void {
    this.filtroActivo = filtro;
  }

  get categoriasDisponibles(): string[] {
    return [...new Set(this.productos.map(producto => producto.categoria))];
  }

  get productosFiltrados(): ProductoInventario[] {
    let resultado = [...this.productos];

    if (this.busqueda.trim()) {
      const texto = this.busqueda.toLowerCase();

      resultado = resultado.filter(producto =>
        producto.nombre.toLowerCase().includes(texto) ||
        producto.sku.toLowerCase().includes(texto)
      );
    }

    if (this.categoriaSeleccionada !== 'todas') {
      resultado = resultado.filter(producto =>
        producto.categoria === this.categoriaSeleccionada
      );
    }

    if (this.filtroActivo === 'promociones') {
      resultado = resultado.filter(producto => producto.promocionActiva);
    }

    if (this.filtroActivo === 'msi') {
      resultado = resultado.filter(producto => producto.msiActivo);
    }

    if (this.filtroActivo === 'ultimas') {
      resultado = resultado.filter(producto => producto.ultimasPiezas);
    }

    if (this.filtroActivo === 'sin-stock') {
      resultado = resultado.filter(producto => producto.stock === 0);
    }

    return resultado;
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
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-editar-producto',
  standalone: true,
  imports: [RouterLink, FormsModule, DecimalPipe],
  templateUrl: './editar-producto.html',
  styleUrl: './editar-producto.css'
})
export class EditarProducto {

  producto = {
    nombre: 'Bota Durango Clásica',
    codigo: 'DW-001',
    precio: 3200,
    categoria: 'Botas',
    stock: 15,
    estado: 'Activo',
    descripcion: 'Bota western clásica elaborada en piel premium con acabado artesanal.',

    promocionActiva: true,
    porcentajeDescuento: 25,
    msiActivo: true,
    mesesMsi: 6,
    ultimasPiezas: false,
    promocionDestacada: true,
    fechaInicioPromo: '2026-05-20',
    fechaFinPromo: '2026-06-10',
    etiquetaPromo: '25% OFF'
  };

  get precioOferta(): number {
    if (!this.producto.promocionActiva || this.producto.porcentajeDescuento <= 0) {
      return this.producto.precio;
    }

    return this.producto.precio - (this.producto.precio * this.producto.porcentajeDescuento / 100);
  }

}
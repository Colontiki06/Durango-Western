import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';

import { ApiService } from '../../../core/services/api/api.service';

@Component({
  selector: 'app-agregar-producto',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './agregar-producto.html',
  styleUrl: './agregar-producto.css'
})
export class AgregarProducto implements OnInit {

  private api = inject(ApiService);
  private router = inject(Router);

  loading = signal(false);
  categorias = signal<any[]>([]);
  tallas = signal<any[]>([]);


  producto: any = {
  nombre: '',
  precio: 0,
  costo: 0,
  categoria_id: '',
  descripcion: '',
  estado: 'Activo',
  variantes: []
};

  nuevaVariante = {
  talla_id: '',
  stock: 0,
  precio_extra: 0,
  peso_kg: 1,
  largo_cm: 30,
  ancho_cm: 20,
  alto_cm: 10
};

  imagenesSeleccionadas: File[] = [];
  previews: string[] = [];

  ngOnInit(): void {
    this.cargarCategorias();
    this.cargarTallas();
  }

  cargarCategorias(): void {
    this.api.get<any[]>('categorias').subscribe({
      next: data => this.categorias.set(data),
      error: error => console.error('Error cargando categorías:', error)
    });
  }

  cargarTallas(): void {
    this.api.get<any[]>('tallas').subscribe({
      next: data => this.tallas.set(data),
      error: error => console.error('Error cargando tallas:', error)
    });
  }

  agregarVariante(): void {
    if (!this.nuevaVariante.talla_id) {
      alert('Selecciona una talla');
      return;
    }

    const talla = this.tallas().find(t => t.id === this.nuevaVariante.talla_id);

    const yaExiste = this.producto.variantes.some(
      (v: any) => v.talla_id === this.nuevaVariante.talla_id
    );

    if (yaExiste) {
      alert('Esa talla ya fue agregada');
      return;
    }

    this.producto.variantes.push({
      talla_id: this.nuevaVariante.talla_id,
      talla_nombre: talla?.nombre ?? '',
      talla_tipo: talla?.tipo ?? '',
      stock: Number(this.nuevaVariante.stock ?? 0),
      precio_extra: Number(this.nuevaVariante.precio_extra ?? 0), 
      peso_kg: Number(this.nuevaVariante.peso_kg ?? 1),
      largo_cm: Number(this.nuevaVariante.largo_cm ?? 30),
      ancho_cm: Number(this.nuevaVariante.ancho_cm ?? 20),
      alto_cm: Number(this.nuevaVariante.alto_cm ?? 10),
    });

    this.nuevaVariante = {
  talla_id: '',
  stock: 0,
  precio_extra: 0,
  peso_kg: 1,
  largo_cm: 30,
  ancho_cm: 20,
  alto_cm: 10
};
  }

  eliminarVariante(index: number): void {
    this.producto.variantes.splice(index, 1);
  }

  seleccionarImagenes(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) return;

    const archivos = Array.from(input.files);

    this.imagenesSeleccionadas.push(...archivos);

    archivos.forEach(file => {
      const reader = new FileReader();

      reader.onload = () => {
        this.previews.push(reader.result as string);
      };

      reader.readAsDataURL(file);
    });

    input.value = '';
  }

  eliminarPreview(index: number): void {
    this.imagenesSeleccionadas.splice(index, 1);
    this.previews.splice(index, 1);
  }

  guardarProducto(): void {
    if (!this.producto.nombre.trim()) {
      alert('Ingresa el nombre del producto');
      return;
    }

    if (!this.producto.categoria_id) {
      alert('Selecciona una categoría');
      return;
    }

    this.loading.set(true);

    const payload = {
      nombre: this.producto.nombre,
      precio: Number(this.producto.precio),
      costo: Number(this.producto.costo ?? 0),
      categoria_id: this.producto.categoria_id,
      descripcion: this.producto.descripcion,
      estado: this.producto.estado,
      variantes: this.producto.variantes.map((v: any) => ({
        talla_id: v.talla_id,
        stock: Number(v.stock),
        peso_kg: Number(v.peso_kg ?? 1),
        largo_cm: Number(v.largo_cm ?? 30),
        ancho_cm: Number(v.ancho_cm ?? 20),
        alto_cm: Number(v.alto_cm ?? 10),
        precio_extra: Number(v.precio_extra ?? 0)
      }))
    };

    this.api.post<any>('productos', payload).subscribe({
      next: productoCreado => {
        if (this.imagenesSeleccionadas.length === 0) {
          this.loading.set(false);
          alert('Producto creado correctamente');
          this.router.navigate(['/admin/editar-producto', productoCreado.id]);
          return;
        }

        const uploads = this.imagenesSeleccionadas.map(file => {
          const formData = new FormData();
          formData.append('imagen', file);

          return this.api.post<any>(`productos/${productoCreado.id}/imagen`, formData);
        });

        forkJoin(uploads).subscribe({
          next: () => {
            this.loading.set(false);
            alert('Producto creado correctamente');
            this.router.navigate(['/admin/editar-producto', productoCreado.id]);
          },
          error: error => {
            console.error('Error subiendo imágenes:', error);
            this.loading.set(false);
            alert('El producto se creó, pero hubo un error subiendo imágenes');
            this.router.navigate(['/admin/editar-producto', productoCreado.id]);
          }
        });

        for (const variante of this.producto.variantes) {

  if (Number(variante.stock) < 0) {
    alert(`La talla ${variante.talla_nombre} tiene stock inválido`);
    return;
  }

  if (!Number.isInteger(Number(variante.peso_kg)) || Number(variante.peso_kg) <= 0) {
    alert(`La talla ${variante.talla_nombre} debe tener un peso válido`);
    return;
  }

  if (!Number.isInteger(Number(variante.largo_cm)) || Number(variante.largo_cm) <= 0) {
    alert(`La talla ${variante.talla_nombre} debe tener un largo válido`);
    return;
  }

  if (!Number.isInteger(Number(variante.ancho_cm)) || Number(variante.ancho_cm) <= 0) {
    alert(`La talla ${variante.talla_nombre} debe tener un ancho válido`);
    return;
  }

  if (!Number.isInteger(Number(variante.alto_cm)) || Number(variante.alto_cm) <= 0) {
    alert(`La talla ${variante.talla_nombre} debe tener un alto válido`);
    return;
  }
}

      },
      error: error => {
        console.error('Error creando producto:', error);
        this.loading.set(false);
        alert('No se pudo crear el producto');
      }
    });
  }
}
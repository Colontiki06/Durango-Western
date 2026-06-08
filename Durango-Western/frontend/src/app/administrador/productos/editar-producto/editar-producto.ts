import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ApiService } from '../../../core/services/api/api.service';

@Component({
  selector: 'app-editar-producto',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './editar-producto.html',
  styleUrl: './editar-producto.css'
})
export class EditarProducto implements OnInit {

  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private router = inject(Router);

  loading = signal(true);
  error = signal('');

  tallas = signal<any[]>([]);
  categorias = signal<any[]>([]);

  imagenSeleccionada: File | null = null;

  nuevaVariante = {
    talla_id: '',
    stock: 0,
    precio_extra: 0,
    peso_kg: 1,
    largo_cm: 30,
    ancho_cm: 20,
    alto_cm: 10,
  };

  producto = signal<any>({
    id: '',
    nombre: '',
    codigo: '',
    precio: 0,
    costo: 0,
    categoria_id: '',
    categoria: '',
    stock: 0,
    estado: 'Activo',
    descripcion: '',
    imagen: '',
    imagenes: [],
    variantes: [],

    promocionActiva: false,
    porcentajeDescuento: 0,
    msiActivo: false,
    mesesMsi: 0,
    ultimasPiezas: false,
    promocionDestacada: false,
    fechaInicioPromo: '',
    fechaFinPromo: '',
    etiquetaPromo: ''
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.error.set('Producto no encontrado');
      this.loading.set(false);
      return;
    }

    this.cargarCategorias();
    this.cargarTallas();
    this.cargarProducto(id);
  }

  cargarProducto(id: string): void {
    this.loading.set(true);
    this.error.set('');

    this.api.get<any>(`productos/${id}`).subscribe({
      next: (data) => {
        const imagenesOrdenadas = [...(data.producto_imagenes ?? [])].sort(
          (a: any, b: any) => {
            if (a.principal && !b.principal) return -1;
            if (!a.principal && b.principal) return 1;
            return (a.orden ?? 0) - (b.orden ?? 0);
          }
        );

        const imagenPrincipal =
          imagenesOrdenadas.find((img: any) => img.principal)?.imagen_url ||
          imagenesOrdenadas[0]?.imagen_url ||
          '';

        const variantes = (data.producto_variantes ?? []).map((variante: any) => ({
          ...variante,
          stock: Number(variante.stock ?? 0),
          peso_kg: Number(variante.peso_kg ?? 1),
          largo_cm: Number(variante.largo_cm ?? 30),
          ancho_cm: Number(variante.ancho_cm ?? 20),
          alto_cm: Number(variante.alto_cm ?? 10),
        }));

        this.producto.set({
          id: data.id,
          nombre: data.nombre ?? '',
          codigo: data.codigo ?? '',
          precio: Number(data.precio ?? 0),
          costo: Number(data.costo ?? 0),
          categoria_id: data.categoria_id ?? '',
          categoria: data.categorias?.nombre ?? 'Sin categoría',
          stock: variantes.reduce((total: number, v: any) => total + Number(v.stock ?? 0), 0),
          estado: data.activo ? 'Activo' : 'Oculto',
          descripcion: data.descripcion ?? '',
          imagen: imagenPrincipal,
          imagenes: imagenesOrdenadas,
          variantes,

          promocionActiva: false,
          porcentajeDescuento: 0,
          msiActivo: false,
          mesesMsi: 0,
          ultimasPiezas: false,
          promocionDestacada: false,
          fechaInicioPromo: '',
          fechaFinPromo: '',
          etiquetaPromo: ''
        });

        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error cargando producto:', error);
        this.error.set('No se pudo cargar el producto');
        this.loading.set(false);
      }
    });
  }

  cargarTallas(): void {
    this.api.get<any[]>('tallas').subscribe({
      next: (data) => this.tallas.set(data),
      error: (error) => console.error('Error cargando tallas:', error)
    });
  }

  cargarCategorias(): void {
    this.api.get<any[]>('categorias').subscribe({
      next: (data) => this.categorias.set(data),
      error: (error) => console.error('Error cargando categorías:', error)
    });
  }

  actualizarCampo(campo: string, valor: any): void {
    this.producto.update(producto => ({
      ...producto,
      [campo]: valor
    }));
  }

  actualizarDatoVariante(varianteId: string, campo: string, valor: any): void {
    const productoActual = this.producto();

    const variantes = productoActual.variantes.map((variante: any) => {
      if (variante.id !== varianteId) return variante;

      return {
        ...variante,
        [campo]: Number(valor),
      };
    });

    const stockTotal = variantes.reduce(
      (total: number, variante: any) => total + Number(variante.stock ?? 0),
      0,
    );

    this.producto.set({
      ...productoActual,
      variantes,
      stock: stockTotal,
    });
  }

  actualizarStockLocal(varianteId: string, stock: any): void {
    this.actualizarDatoVariante(varianteId, 'stock', stock);
  }

  agregarVariante(): void {
    const producto = this.producto();

    if (!this.nuevaVariante.talla_id) {
      alert('Selecciona una talla');
      return;
    }

    if (!Number.isInteger(Number(this.nuevaVariante.stock)) || Number(this.nuevaVariante.stock) < 0) {
      alert('El stock debe ser un número entero válido');
      return;
    }

    if (!Number.isInteger(Number(this.nuevaVariante.peso_kg)) || Number(this.nuevaVariante.peso_kg) <= 0) {
      alert('El peso debe ser un número entero mayor a 0');
      return;
    }

    if (!Number.isInteger(Number(this.nuevaVariante.largo_cm)) || Number(this.nuevaVariante.largo_cm) <= 0) {
      alert('El largo debe ser un número entero mayor a 0');
      return;
    }

    if (!Number.isInteger(Number(this.nuevaVariante.ancho_cm)) || Number(this.nuevaVariante.ancho_cm) <= 0) {
      alert('El ancho debe ser un número entero mayor a 0');
      return;
    }

    if (!Number.isInteger(Number(this.nuevaVariante.alto_cm)) || Number(this.nuevaVariante.alto_cm) <= 0) {
      alert('El alto debe ser un número entero mayor a 0');
      return;
    }

    this.api.post<any>(`productos/${producto.id}/variantes`, {
      talla_id: this.nuevaVariante.talla_id,
      stock: Number(this.nuevaVariante.stock ?? 0),
      precio_extra: Number(this.nuevaVariante.precio_extra ?? 0),
      peso_kg: Number(this.nuevaVariante.peso_kg ?? 1),
      largo_cm: Number(this.nuevaVariante.largo_cm ?? 30),
      ancho_cm: Number(this.nuevaVariante.ancho_cm ?? 20),
      alto_cm: Number(this.nuevaVariante.alto_cm ?? 10),
    }).subscribe({
      next: () => {
        this.nuevaVariante = {
          talla_id: '',
          stock: 0,
          precio_extra: 0,
          peso_kg: 1,
          largo_cm: 30,
          ancho_cm: 20,
          alto_cm: 10,
        };

        this.cargarProducto(producto.id);
        alert('Variante agregada correctamente');
      },
      error: (error) => {
        console.error('Error agregando variante:', error);
        alert('No se pudo agregar la variante');
      }
    });
  }

  seleccionarImagen(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) return;

    this.imagenSeleccionada = input.files[0];
    this.subirImagen();
  }

  subirImagen(): void {
    const producto = this.producto();

    if (!this.imagenSeleccionada) {
      alert('Selecciona una imagen');
      return;
    }

    const formData = new FormData();
    formData.append('imagen', this.imagenSeleccionada);

    this.api.post<any>(`productos/${producto.id}/imagen`, formData).subscribe({
      next: () => {
        this.imagenSeleccionada = null;
        this.cargarProducto(producto.id);
        alert('Imagen agregada correctamente');
      },
      error: (error) => {
        console.error('Error subiendo imagen:', error);
        alert('No se pudo subir la imagen');
      }
    });
  }

  marcarImagenPrincipal(imagenId: string): void {
    const producto = this.producto();

    this.api.patch<any>(`productos/imagenes/${imagenId}/principal`, {}).subscribe({
      next: () => {
        this.cargarProducto(producto.id);
        alert('Imagen principal actualizada');
      },
      error: (error) => {
        console.error('Error marcando imagen principal:', error);
        alert('No se pudo marcar la imagen principal');
      }
    });
  }

  eliminarImagen(imagenId: string): void {
    const confirmar = confirm('¿Seguro que deseas eliminar esta imagen?');

    if (!confirmar) return;

    const producto = this.producto();

    this.api.delete<any>(`productos/imagenes/${imagenId}`).subscribe({
      next: () => {
        this.cargarProducto(producto.id);
        alert('Imagen eliminada correctamente');
      },
      error: (error) => {
        console.error('Error eliminando imagen:', error);
        alert('No se pudo eliminar la imagen');
      }
    });
  }

  ocultarProducto(): void {
    const producto = this.producto();

    const confirmar = confirm(
      `¿Seguro que deseas ocultar "${producto.nombre}"? Ya no aparecerá en la tienda.`
    );

    if (!confirmar) return;

    this.api.patch<any>(`productos/${producto.id}/ocultar`, {}).subscribe({
      next: () => {
        alert('Producto ocultado correctamente');
        this.router.navigate(['/admin/inventario']);
      },
      error: (error) => {
        console.error('Error ocultando producto:', error);
        alert('No se pudo ocultar el producto');
      }
    });
  }

  calcularStock(producto: any): number {
    return (producto.producto_variantes ?? [])
      .reduce((total: number, variante: any) => total + Number(variante.stock ?? 0), 0);
  }

  get precioOferta(): number {
    const producto = this.producto();

    if (!producto.promocionActiva || producto.porcentajeDescuento <= 0) {
      return producto.precio;
    }

    return producto.precio - (producto.precio * producto.porcentajeDescuento / 100);
  }

  guardarCambios(): void {
    const producto = this.producto();

    for (const variante of producto.variantes ?? []) {
      if (!Number.isInteger(Number(variante.stock)) || Number(variante.stock) < 0) {
        alert(`La talla ${variante.tallas?.nombre ?? ''} tiene stock inválido`);
        return;
      }

      if (!Number.isInteger(Number(variante.peso_kg)) || Number(variante.peso_kg) <= 0) {
        alert(`La talla ${variante.tallas?.nombre ?? ''} debe tener peso válido`);
        return;
      }

      if (!Number.isInteger(Number(variante.largo_cm)) || Number(variante.largo_cm) <= 0) {
        alert(`La talla ${variante.tallas?.nombre ?? ''} debe tener largo válido`);
        return;
      }

      if (!Number.isInteger(Number(variante.ancho_cm)) || Number(variante.ancho_cm) <= 0) {
        alert(`La talla ${variante.tallas?.nombre ?? ''} debe tener ancho válido`);
        return;
      }

      if (!Number.isInteger(Number(variante.alto_cm)) || Number(variante.alto_cm) <= 0) {
        alert(`La talla ${variante.tallas?.nombre ?? ''} debe tener alto válido`);
        return;
      }
    }

    const payload = {
      nombre: producto.nombre,
      codigo: producto.codigo,
      descripcion: producto.descripcion,
      precio: Number(producto.precio),
      costo: Number(producto.costo ?? 0),
      estado: producto.estado,
      categoria_id: producto.categoria_id,
      variantes: producto.variantes.map((variante: any) => ({
        id: variante.id,
        stock: Number(variante.stock),
        peso_kg: Number(variante.peso_kg),
        largo_cm: Number(variante.largo_cm),
        ancho_cm: Number(variante.ancho_cm),
        alto_cm: Number(variante.alto_cm),
      }))
    };

    this.api.patch<any>(`productos/${producto.id}`, payload).subscribe({
      next: (data) => {
        this.producto.update(productoActual => ({
          ...productoActual,
          categoria_id: data.categoria_id ?? productoActual.categoria_id,
          categoria: data.categorias?.nombre ?? productoActual.categoria,
          stock: this.calcularStock(data),
          variantes: (data.producto_variantes ?? []).map((variante: any) => ({
            ...variante,
            stock: Number(variante.stock ?? 0),
            peso_kg: Number(variante.peso_kg ?? 1),
            largo_cm: Number(variante.largo_cm ?? 30),
            ancho_cm: Number(variante.ancho_cm ?? 20),
            alto_cm: Number(variante.alto_cm ?? 10),
          })),
          imagenes: data.producto_imagenes ?? []
        }));

        alert('Producto actualizado correctamente');
      },
      error: (error) => {
        console.error('Error actualizando producto:', error);
        alert('No se pudo actualizar el producto');
      }
    });
  }

  moverImagen(imagenId: string, direccion: 'arriba' | 'abajo'): void {
    const producto = this.producto();
    const imagenes = [...producto.imagenes];

    const index = imagenes.findIndex((img: any) => img.id === imagenId);

    if (index === -1) return;

    const nuevoIndex = direccion === 'arriba' ? index - 1 : index + 1;

    if (nuevoIndex < 0 || nuevoIndex >= imagenes.length) return;

    const temp = imagenes[index];
    imagenes[index] = imagenes[nuevoIndex];
    imagenes[nuevoIndex] = temp;

    const imagenesReordenadas = imagenes.map((img: any, i: number) => ({
      ...img,
      orden: i + 1
    }));

    this.producto.update(productoActual => ({
      ...productoActual,
      imagenes: imagenesReordenadas
    }));

    this.guardarOrdenImagenes(imagenesReordenadas);
  }

  guardarOrdenImagenes(imagenes: any[]): void {
    const producto = this.producto();

    let completadas = 0;

    imagenes.forEach((imagen: any) => {
      this.api.patch<any>(`productos/imagenes/${imagen.id}/orden`, {
        orden: imagen.orden
      }).subscribe({
        next: () => {
          completadas++;

          if (completadas === imagenes.length) {
            this.cargarProducto(producto.id);
          }
        },
        error: (error) => {
          console.error('Error actualizando orden de imagen:', error);
          alert('No se pudo actualizar el orden de las imágenes');
        }
      });
    });
  }

}
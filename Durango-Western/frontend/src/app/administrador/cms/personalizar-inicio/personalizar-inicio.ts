import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../../../core/services/api/api.service';

@Component({
  selector: 'app-personalizar-inicio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './personalizar-inicio.html',
  styleUrl: './personalizar-inicio.css'
})
export class PersonalizarInicio implements OnInit {
  private cdr = inject(ChangeDetectorRef);

  loading = true;
  guardando = false;
  subiendoImagen = false;

  guardandoBannerId = '';
  guardandoCategoriaId = '';
  subiendoImagenBannerId = '';
  subiendoImagenCategoriaId = '';

  mensaje = '';

  showAddBannerModal = false;
  showAddCategoriaModal = false;

  categoriasCatalogo: any[] = [];
  banners: any[] = [];
  categorias: any[] = [];

  nuevoBanner = {
    textoSuperior: '',
    titulo: '',
    descripcion: '',
    imagen: '/img/banner.png',
    textoBoton: 'Ver colección',
    enlaceBoton: '/productos',
    activo: true
  };

  nuevaCategoria = {
    categoria_id: '',
    nombre: '',
    slug: '',
    enlace: '',
    imagen: '',
    activa: true
  };

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.cargarInicio();
    this.cargarCategoriasCatalogo();
  }

  cargarInicio(): void {
    this.loading = true;
    this.cdr.detectChanges();

    this.api.get<any>('personalizar-inicio').subscribe({
      next: (data) => {
        this.banners = (data.banners ?? []).map((banner: any) => ({
          id: banner.id,
          textoSuperior: banner.texto_superior ?? '',
          titulo: banner.titulo ?? '',
          descripcion: banner.descripcion ?? '',
          imagen: banner.imagen_url ?? '',
          textoBoton: banner.texto_boton ?? 'Ver colección',
          enlaceBoton: banner.enlace_boton ?? '/productos',
          activo: banner.activo ?? true,
          orden: banner.orden ?? 0,
        }));

        this.categorias = (data.categorias ?? []).map((categoria: any) => ({
          id: categoria.id,
          categoria_id: categoria.categoria_id ?? '',
          nombre: categoria.nombre ?? '',
          slug: categoria.slug ?? '',
          enlace: categoria.enlace ?? '/productos',
          imagen: categoria.imagen_url ?? '',
          activa: categoria.activa ?? true,
          orden: categoria.orden ?? 0,
        }));

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error cargando personalización:', error);
        this.loading = false;
        this.mostrarMensaje('No se pudo cargar la personalización');
        this.cdr.detectChanges();
      }
    });
  }

  cargarCategoriasCatalogo(): void {
    this.api.get<any[]>('categorias').subscribe({
      next: (data) => {
        this.categoriasCatalogo = Array.isArray(data) ? data : [];
      },
      error: (error) => {
        console.error('Error cargando categorías del catálogo:', error);
      }
    });
  }

  guardarBanner(banner: any): void {
    if (!banner.titulo?.trim()) {
      alert('El banner debe tener título');
      return;
    }

    if (!banner.imagen?.trim()) {
      alert('El banner debe tener imagen');
      return;
    }

    this.guardandoBannerId = banner.id;

    this.api.patch<any>(`personalizar-inicio/banners/${banner.id}`, {
      textoSuperior: banner.textoSuperior,
      titulo: banner.titulo,
      descripcion: banner.descripcion,
      imagen: banner.imagen,
      textoBoton: banner.textoBoton,
      enlaceBoton: banner.enlaceBoton,
      activo: banner.activo,
      orden: banner.orden,
    }).subscribe({
      next: () => {
        this.guardandoBannerId = '';
        this.mostrarMensaje('Banner guardado correctamente');
        this.cargarInicio();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error guardando banner:', error);
        this.guardandoBannerId = '';
        alert('No se pudo guardar el banner');
      }
    });
  }

  agregarBanner(): void {
    if (!this.nuevoBanner.titulo.trim()) {
      alert('Agrega un título para el banner');
      return;
    }

    if (!this.nuevoBanner.imagen.trim()) {
      alert('Agrega una imagen para el banner');
      return;
    }

    this.guardando = true;

    this.api.post<any>('personalizar-inicio/banners', this.nuevoBanner).subscribe({
      next: () => {
        this.guardando = false;
        this.cerrarModalBanner();
        this.mostrarMensaje('Banner agregado correctamente');
        this.cargarInicio();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error agregando banner:', error);
        this.guardando = false;
        alert('No se pudo agregar el banner');
      }
    });
  }

  eliminarBanner(index: number): void {
    const banner = this.banners[index];

    if (!banner?.id) return;

    const confirmar = confirm('¿Seguro que deseas eliminar este banner?');
    if (!confirmar) return;

    this.api.delete<any>(`personalizar-inicio/banners/${banner.id}`).subscribe({
      next: () => {
        this.mostrarMensaje('Banner eliminado correctamente');
        this.cargarInicio();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error eliminando banner:', error);
        alert('No se pudo eliminar el banner');
        this.cdr.detectChanges();
      }
    });
  }

  guardarCategoria(categoria: any): void {
    if (!categoria.categoria_id) {
      alert('Selecciona una categoría del catálogo');
      return;
    }

    if (!categoria.nombre?.trim()) {
      alert('La categoría debe tener nombre');
      return;
    }

    if (!categoria.imagen?.trim()) {
      alert('La categoría debe tener imagen');
      return;
    }

    this.guardandoCategoriaId = categoria.id;

    this.api.patch<any>(`personalizar-inicio/categorias/${categoria.id}`, {
      categoria_id: categoria.categoria_id,
      nombre: categoria.nombre,
      slug: categoria.slug,
      enlace: categoria.enlace,
      imagen: categoria.imagen,
      activa: categoria.activa,
      orden: categoria.orden,
    }).subscribe({
      next: () => {
        this.guardandoCategoriaId = '';
        this.mostrarMensaje('Categoría guardada correctamente');
        this.cargarInicio();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error guardando categoría:', error);
        this.guardandoCategoriaId = '';
        alert('No se pudo guardar la categoría');
        this.cdr.detectChanges();
      }
    });
  }

  agregarCategoria(): void {
    if (!this.nuevaCategoria.categoria_id) {
      alert('Selecciona una categoría del catálogo');
      return;
    }

    if (!this.nuevaCategoria.nombre.trim()) {
      alert('Agrega un nombre para la categoría');
      return;
    }

    if (!this.nuevaCategoria.imagen.trim()) {
      alert('Agrega una imagen para la categoría');
      return;
    }

    this.guardando = true;

    this.api.post<any>('personalizar-inicio/categorias', this.nuevaCategoria).subscribe({
      next: () => {
        this.guardando = false;
        this.cerrarModalCategoria();
        this.mostrarMensaje('Categoría agregada correctamente');
        this.cargarInicio();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error agregando categoría:', error);
        this.guardando = false;
        alert('No se pudo agregar la categoría');
          this.cdr.detectChanges();
      }
    });
  }

  eliminarCategoria(index: number): void {
    const categoria = this.categorias[index];

    if (!categoria?.id) return;

    const confirmar = confirm('¿Seguro que deseas eliminar esta categoría?');
    if (!confirmar) return;

    this.api.delete<any>(`personalizar-inicio/categorias/${categoria.id}`).subscribe({
      next: () => {
        this.mostrarMensaje('Categoría eliminada correctamente');
        this.cargarInicio();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error eliminando categoría:', error);
        alert('No se pudo eliminar la categoría');
      }
    });
  }

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

  abrirModalCategoria(): void {
    this.showAddCategoriaModal = true;
  }

  cerrarModalCategoria(): void {
    this.showAddCategoriaModal = false;

    this.nuevaCategoria = {
      categoria_id: '',
      nombre: '',
      slug: '',
      enlace: '',
      imagen: '',
      activa: true
    };
  }

  categoriaSeleccionadaCambio(categoriaHome: any): void {
    const categoria = this.categoriasCatalogo.find(
      (cat: any) => cat.id === categoriaHome.categoria_id
    );

    if (!categoria) return;

    categoriaHome.nombre = categoria.nombre;
    categoriaHome.slug = categoria.slug;
    categoriaHome.enlace = `/productos/${categoria.slug}`;
  }

  nuevaCategoriaSeleccionadaCambio(): void {
    const categoria = this.categoriasCatalogo.find(
      (cat: any) => cat.id === this.nuevaCategoria.categoria_id
    );

    if (!categoria) return;

    this.nuevaCategoria.nombre = categoria.nombre;
    this.nuevaCategoria.slug = categoria.slug;
    this.nuevaCategoria.enlace = `/productos/${categoria.slug}`;
  }

  subirImagenBanner(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const formData = new FormData();
    formData.append('imagen', input.files[0]);

    this.subiendoImagen = true;

    this.api.post<any>('personalizar-inicio/imagen', formData).subscribe({
      next: (respuesta) => {
        this.nuevoBanner.imagen = respuesta?.url ?? '';
        this.subiendoImagen = false;
        this.mostrarMensaje('Imagen subida correctamente');
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error subiendo imagen:', error);
        this.subiendoImagen = false;
        alert('No se pudo subir la imagen');
        this.cdr.detectChanges();
      },
      complete: () => {
        this.subiendoImagen = false;
      }
    });

    input.value = '';
  }

  subirImagenBannerExistente(event: Event, banner: any): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const formData = new FormData();
    formData.append('imagen', input.files[0]);

    this.subiendoImagenBannerId = banner.id;

    this.api.post<any>('personalizar-inicio/imagen', formData).subscribe({
      next: (respuesta) => {
        banner.imagen = respuesta?.url ?? '';
        this.subiendoImagenBannerId = '';
        this.mostrarMensaje('Imagen subida correctamente. Ahora guarda el banner.');
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error subiendo imagen:', error);
        this.subiendoImagenBannerId = '';
        alert('No se pudo subir la imagen');
        this.cdr.detectChanges();
      },
      complete: () => {
        this.subiendoImagenBannerId = '';
      }
    });

    input.value = '';
  }

  subirImagenNuevaCategoria(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const formData = new FormData();
    formData.append('imagen', input.files[0]);

    this.subiendoImagen = true;

    this.api.post<any>('personalizar-inicio/imagen', formData).subscribe({
      next: (respuesta) => {
        this.nuevaCategoria.imagen = respuesta?.url ?? '';
        this.subiendoImagen = false;
        this.mostrarMensaje('Imagen subida correctamente');
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error subiendo imagen de categoría:', error);
        this.subiendoImagen = false;
        alert('No se pudo subir la imagen');
        this.cdr.detectChanges();
      },
      complete: () => {
        this.subiendoImagen = false;
      }
    });

    input.value = '';
  }

  subirImagenCategoriaExistente(event: Event, categoria: any): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const formData = new FormData();
    formData.append('imagen', input.files[0]);

    this.subiendoImagenCategoriaId = categoria.id;

    this.api.post<any>('personalizar-inicio/imagen', formData).subscribe({
      next: (respuesta) => {
        categoria.imagen = respuesta?.url ?? '';
        this.subiendoImagenCategoriaId = '';
        this.mostrarMensaje('Imagen subida correctamente. Ahora guarda la categoría.');
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error subiendo imagen de categoría:', error);
        this.subiendoImagenCategoriaId = '';
        alert('No se pudo subir la imagen');
        this.cdr.detectChanges();
      },
      complete: () => {
        this.subiendoImagenCategoriaId = '';
      }
    });

    input.value = '';
  }

  private mostrarMensaje(texto: string): void {
    this.mensaje = texto;

    setTimeout(() => {
      this.mensaje = '';
    }, 2500);
  }
}
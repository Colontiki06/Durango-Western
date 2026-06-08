import { Component, OnInit, ChangeDetectorRef ,inject} from '@angular/core';
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

  loading = true;
  guardando = false;
  mensaje = '';

  showAddBannerModal = false;
  showAddCategoriaModal = false;

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
    nombre: '',
    imagen: '/img/Sombreros.png',
    activa: true
  };
  categoriasCatalogo: any[] = [];
  banners: any[] = [];
  categorias: any[] = [];
  private cdr = inject(ChangeDetectorRef);

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.cargarInicio();
    this.cargarCategoriasCatalogo();
  }

  cargarInicio(): void {
    this.loading = true;

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
          nombre: categoria.nombre ?? '',
          imagen: categoria.imagen_url ?? '',
          activa: categoria.activa ?? true,
          orden: categoria.orden ?? 0,
        }));

        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando personalización:', error);
        this.loading = false;
        this.mostrarMensaje('No se pudo cargar la personalización');
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

    this.guardando = true;

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
        this.guardando = false;
        this.mostrarMensaje('Banner guardado correctamente');
        this.cargarInicio();
      },
      error: (error) => {
        console.error('Error guardando banner:', error);
        this.guardando = false;
        alert('No se pudo guardar el banner');
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

  agregarBanner(): void {
    if (!this.nuevoBanner.titulo.trim()) {
      alert('Agrega un título para el banner');
      return;
    }

    if (!this.nuevoBanner.imagen.trim()) {
      alert('Agrega una ruta de imagen');
      return;
    }

    this.guardando = true;

    this.api.post<any>('personalizar-inicio/banners', this.nuevoBanner).subscribe({
      next: () => {
        this.guardando = false;
        this.cerrarModalBanner();
        this.mostrarMensaje('Banner agregado correctamente');
        this.cargarInicio();
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

    if (!banner?.id) {
      this.banners.splice(index, 1);
      return;
    }

    const confirmar = confirm('¿Seguro que deseas eliminar este banner?');
    if (!confirmar) return;

    this.api.delete<any>(`personalizar-inicio/banners/${banner.id}`).subscribe({
      next: () => {
        this.mostrarMensaje('Banner eliminado correctamente');
        this.cargarInicio();
      },
      error: (error) => {
        console.error('Error eliminando banner:', error);
        alert('No se pudo eliminar el banner');
      }
    });
  }

  guardarCategoria(categoria: any): void {
    if (!categoria.nombre?.trim()) {
      alert('La categoría debe tener nombre');
      return;
    }

    if (!categoria.imagen?.trim()) {
      alert('La categoría debe tener imagen');
      return;
    }

    this.guardando = true;

    this.api.patch<any>(`personalizar-inicio/categorias/${categoria.id}`, {
      nombre: categoria.nombre,
      imagen: categoria.imagen,
      activa: categoria.activa,
      orden: categoria.orden,
    }).subscribe({
      next: () => {
        this.guardando = false;
        this.mostrarMensaje('Categoría guardada correctamente');
        this.cargarInicio();
      },
      error: (error) => {
        console.error('Error guardando categoría:', error);
        this.guardando = false;
        alert('No se pudo guardar la categoría');
      }
    });
  }

  abrirModalCategoria(): void {
    this.showAddCategoriaModal = true;
  }

  cerrarModalCategoria(): void {
    this.showAddCategoriaModal = false;

    this.nuevaCategoria = {
      nombre: '',
      imagen: '/img/Sombreros.png',
      activa: true
    };
  }

  agregarCategoria(): void {
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
      },
      error: (error) => {
        console.error('Error agregando categoría:', error);
        this.guardando = false;
        alert('No se pudo agregar la categoría');
      }
    });
  }

  eliminarCategoria(index: number): void {
    const categoria = this.categorias[index];

    if (!categoria?.id) {
      this.categorias.splice(index, 1);
      return;
    }

    const confirmar = confirm('¿Seguro que deseas eliminar esta categoría?');
    if (!confirmar) return;

    this.api.delete<any>(`personalizar-inicio/categorias/${categoria.id}`).subscribe({
      next: () => {
        this.mostrarMensaje('Categoría eliminada correctamente');
        this.cargarInicio();
      },
      error: (error) => {
        console.error('Error eliminando categoría:', error);
        alert('No se pudo eliminar la categoría');
      }
    });
  }

  subirImagenBanner(event: Event): void {
  const input = event.target as HTMLInputElement;

  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];
  const formData = new FormData();

  formData.append('imagen', file);

  this.guardando = true;

  this.api.post<any>('personalizar-inicio/imagen', formData).subscribe({
    next: (respuesta) => {
      this.nuevoBanner.imagen = respuesta.url;
      this.guardando = false;
      this.mostrarMensaje('Imagen subida correctamente');
    },
    error: (error) => {
      console.error('Error subiendo imagen:', error);
      this.guardando = false;
      alert('No se pudo subir la imagen');
    }
  });

  input.value = '';
}

subirImagenBannerExistente(event: Event, banner: any): void {
  const input = event.target as HTMLInputElement;

  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];
  const formData = new FormData();

  formData.append('imagen', file);

  this.guardando = true;

  this.api.post<any>('personalizar-inicio/imagen', formData).subscribe({
    next: (respuesta) => {
      banner.imagen = respuesta.url;
      this.guardando = false;
      this.mostrarMensaje('Imagen subida correctamente. No olvides guardar el banner.');
    },
    error: (error) => {
      console.error('Error subiendo imagen:', error);
      this.guardando = false;
      alert('No se pudo subir la imagen');
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

}
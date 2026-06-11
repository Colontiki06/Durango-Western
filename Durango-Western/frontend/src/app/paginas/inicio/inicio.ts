import {
  Component,
  ElementRef,
  ViewChild,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  NgZone
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart/cart.service';
import { ApiService } from '../../core/services/api/api.service';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css'
})
export class Inicio implements OnInit, OnDestroy {

  @ViewChild('categoriasCarousel')
  categoriasCarousel!: ElementRef<HTMLDivElement>;

  activeDot = 0;
  bannerActual = 0;
  intervaloBanner: any;

  tallaSeleccionada = 'Única';
  productoVista: any = null;
  varianteSeleccionada: any = null;

  categorias: any[] = [];
  banners: any[] = [];
  productosMasVendidos: any[] = [];

  constructor(
    private cartService: CartService,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.cargarPersonalizacionInicio();
    this.cargarProductosMasVendidos();
  }

  ngOnDestroy(): void {
    if (this.intervaloBanner) {
      clearInterval(this.intervaloBanner);
    }
  }

  cargarProductosMasVendidos(): void {
    this.api.get<any[]>('productos').subscribe({
      next: (productos) => {
        this.productosMasVendidos = [...productos]
          .sort((a, b) => {
            const vendidosB = Number(b.vendidos ?? 0);
            const vendidosA = Number(a.vendidos ?? 0);

            if (vendidosB !== vendidosA) {
              return vendidosB - vendidosA;
            }

            return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
          })
          .slice(0, 3);

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error cargando productos más vendidos:', error);
        this.productosMasVendidos = [];
        this.cdr.detectChanges();
      }
    });
  }

  imagenProducto(producto: any): string {
    const imagenPrincipal = producto?.producto_imagenes?.find(
      (img: any) => img.principal
    );

    return (
      imagenPrincipal?.imagen_url ||
      producto?.producto_imagenes?.[0]?.imagen_url ||
      producto?.imagen ||
      '/img/Sombreros.png'
    );
  }

  rutaProducto(producto: any): string {
    return `/detalle-producto/${producto.slug}`;
  }

  cargarPersonalizacionInicio(): void {
    this.api.get<any>('personalizar-inicio').subscribe({
      next: (data) => {
        this.banners = (data.banners ?? [])
          .filter((banner: any) => banner.activo)
          .map((banner: any) => ({
            textoSuperior: banner.texto_superior ?? '',
            titulo: banner.titulo ?? '',
            descripcion: banner.descripcion ?? '',
            boton: banner.texto_boton ?? 'Ver colección',
            textoBoton: banner.texto_boton ?? 'Ver colección',
            enlaceBoton: banner.enlace_boton ?? 'Todos los productos',
            imagen: banner.imagen_url ?? '/img/banner.png'
          }));

        this.categorias = (data.categorias ?? [])
          .filter((categoria: any) => categoria.activa)
          .map((categoria: any) => ({
            nombre: categoria.nombre ?? '',
            imagen: categoria.imagen_url ?? '/img/Sombreros.png',
            ruta: categoria.enlace ?? '/productos'
          }));

        if (this.banners.length === 0) {
          this.banners = [
            {
              textoSuperior: 'NUEVA COLECCIÓN',
              titulo: 'Estilo western auténtico',
              descripcion: 'Primavera Verano 2026',
              boton: 'Ver colección',
              textoBoton: 'Ver colección',
              enlaceBoton: 'Todos los productos',
              imagen: '/img/banner.png'
            }
          ];
        }

        if (this.categorias.length === 0) {
          this.categorias = [
            { nombre: 'Botas Caballero', imagen: '/img/BotasCaballero.PNG', ruta: '/productos' },
            { nombre: 'Botas Dama', imagen: '/img/BotasDama.png', ruta: '/productos' },
            { nombre: 'Sombreros', imagen: '/img/Sombreros.png', ruta: '/productos' },
            { nombre: 'Camisas', imagen: '/img/Camisas.png', ruta: '/productos' }
          ];
        }

        this.iniciarCarruselBanner();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error cargando inicio personalizado:', error);

        this.banners = [
          {
            textoSuperior: 'NUEVA COLECCIÓN',
            titulo: 'Estilo western auténtico',
            descripcion: 'Primavera Verano 2026',
            boton: 'Ver colección',
            textoBoton: 'Ver colección',
            enlaceBoton: 'Todos los productos',
            imagen: '/img/banner.png'
          }
        ];

        this.categorias = [
          { nombre: 'Botas Caballero', imagen: '/img/BotasCaballero.PNG', ruta: '/productos' },
          { nombre: 'Botas Dama', imagen: '/img/BotasDama.png', ruta: '/productos' },
          { nombre: 'Sombreros', imagen: '/img/Sombreros.png', ruta: '/productos' },
          { nombre: 'Camisas', imagen: '/img/Camisas.png', ruta: '/productos' }
        ];

        this.iniciarCarruselBanner();
        this.cdr.detectChanges();
      }
    });
  }

  iniciarCarruselBanner(): void {
    if (this.intervaloBanner) {
      clearInterval(this.intervaloBanner);
    }

    if (this.banners.length <= 1) return;

    this.intervaloBanner = setInterval(() => {
      this.ngZone.run(() => {
        this.siguienteBanner();
        this.cdr.detectChanges();
      });
    }, 3000);
  }

  siguienteBanner(): void {
    if (this.banners.length === 0) return;
    this.bannerActual = (this.bannerActual + 1) % this.banners.length;
  }

  anteriorBanner(): void {
    if (this.banners.length === 0) return;

    this.bannerActual =
      this.bannerActual === 0
        ? this.banners.length - 1
        : this.bannerActual - 1;

    this.cdr.detectChanges();
  }

  scrollCategorias(direction: 'left' | 'right', event?: Event): void {
    event?.stopPropagation();

    const carousel = this.categoriasCarousel?.nativeElement;
    if (!carousel) return;

    carousel.scrollBy({
      left: direction === 'right' ? 320 : -320,
      behavior: 'smooth'
    });
  }

  abrirVista(producto: any): void {
    this.productoVista = producto;
    this.varianteSeleccionada = producto?.producto_variantes?.[0] ?? null;

    this.tallaSeleccionada =
      this.varianteSeleccionada?.tallas?.nombre ?? 'Única';
  }

  cerrarVista(): void {
    this.productoVista = null;
    this.varianteSeleccionada = null;
    this.tallaSeleccionada = 'Única';
  }

  seleccionarTalla(variante: any): void {
    this.varianteSeleccionada = variante;
    this.tallaSeleccionada = variante?.tallas?.nombre ?? 'Única';
  }

  agregarProductoVista(): void {
    if (!this.productoVista) return;

    const variante = this.varianteSeleccionada;

    this.cartService.addToCart({
      id: this.productoVista.id,
      producto_id: String(this.productoVista.id),
      variante_id: variante?.id ? String(variante.id) : null,
      nombre: this.productoVista.nombre,
      codigo: variante?.codigo ?? variante?.sku ?? this.productoVista.codigo ?? this.productoVista.sku ?? '',
      precio: Number(this.productoVista.precio),
      cantidad: 1,
      talla: variante?.tallas?.nombre ?? 'Única',
      stock: Number(variante?.stock ?? variante?.cantidad ?? this.productoVista.stock ?? 0),
      imagen: this.imagenProducto(this.productoVista)
    });

    this.cerrarVista();
  }

  addToCart(product: any): void {
    const variante = product?.producto_variantes?.[0] ?? null;

    this.cartService.addToCart({
      id: product.id,
      producto_id: String(product.id),
      variante_id: variante?.id ? String(variante.id) : null,
      nombre: product.nombre,
      codigo: variante?.codigo ?? variante?.sku ?? product.codigo ?? product.sku ?? '',
      precio: Number(product.precio),
      cantidad: 1,
      talla: variante?.tallas?.nombre ?? 'Única',
      stock: Number(variante?.stock ?? variante?.cantidad ?? product.stock ?? 0),
      imagen: this.imagenProducto(product)
    });
  }

  normalizarEnlaceBanner(enlace: string): string {
    return (enlace || '')
      .toString()
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  rutaBanner(enlace: string): any[] {
    return ['/productos'];
  }

  queryBanner(enlace: string): any {
    const valor = this.normalizarEnlaceBanner(enlace);

    if (valor.includes('caballero') || valor.includes('hombre')) {
      return { genero: 'caballero' };
    }

    if (valor.includes('dama') || valor.includes('mujer') || valor.includes('ella')) {
      return { genero: 'dama' };
    }

    if (valor.includes('nino') || valor.includes('ninos')) {
      return { genero: 'ninos' };
    }

    if (valor.includes('bota')) {
      return { tipo: 'botas' };
    }

    if (valor.includes('sombrero')) {
      return { tipo: 'sombreros' };
    }

    if (valor.includes('camisa')) {
      return { tipo: 'camisas' };
    }

    if (valor.includes('pantalon') || valor.includes('pantalones')) {
      return { tipo: 'pantalones' };
    }

    if (valor.includes('cinto')) {
      return { tipo: 'cintos' };
    }

    if (
      valor.includes('accesorio') ||
      valor.includes('bolso') ||
      valor.includes('mochila') ||
      valor.includes('gorra')
    ) {
      return { tipo: 'accesorios' };
    }

    return {};
  }
}
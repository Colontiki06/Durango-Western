import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class ProductosService {
  constructor(
    private readonly prisma: PrismaService,

    @Optional()
    private readonly storageService?: StorageService,
  ) {}

  private get db(): any {
    return this.prisma as any;
  }

  private normalizarTexto(valor: string): string {
    return String(valor || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private generarSlugBase(texto: string): string {
    return this.normalizarTexto(texto)
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private async generarSlugUnico(nombre: string, productoId?: string) {
    const slugBase = this.generarSlugBase(nombre);

    if (!slugBase) {
      throw new BadRequestException(
        'El nombre del producto no genera un slug válido',
      );
    }

    let slug = slugBase;
    let contador = 2;

    while (true) {
      const existente = await this.db.productos.findFirst({
        where: {
          slug,
          ...(productoId
            ? {
                id: {
                  not: productoId,
                },
              }
            : {}),
        },
        select: {
          id: true,
        },
      });

      if (!existente) {
        return slug;
      }

      slug = `${slugBase}-${contador}`;
      contador++;
    }
  }

  private detectarTipoProducto(nombre: string): string {
    const texto = this.normalizarTexto(nombre);

    if (texto.includes('bota') || texto.includes('botin')) {
      return 'bota';
    }

    if (texto.includes('sombrero') || texto.includes('tejano')) {
      return 'sombrero';
    }

    if (texto.includes('camisa')) {
      return 'camisa';
    }

    if (texto.includes('pantalon') || texto.includes('jean')) {
      return 'pantalon';
    }

    if (texto.includes('cinto') || texto.includes('cinturon')) {
      return 'cinto';
    }

    if (texto.includes('hebilla')) {
      return 'hebilla';
    }

    if (texto.includes('chaleco')) {
      return 'chaleco';
    }

    if (texto.includes('chamarra') || texto.includes('chaqueta')) {
      return 'chamarra';
    }

    return 'producto';
  }

  private detectarPrefijoCategoria(nombre: string): string {
    const texto = this.normalizarTexto(nombre);

    if (
      texto.includes('caballero') ||
      texto.includes('hombre') ||
      texto.includes('masculino')
    ) {
      return 'CAB';
    }

    if (
      texto.includes('dama') ||
      texto.includes('mujer') ||
      texto.includes('femenino')
    ) {
      return 'DAM';
    }

    if (
      texto.includes('nino') ||
      texto.includes('nina') ||
      texto.includes('infantil') ||
      texto.includes('niño') ||
      texto.includes('niña')
    ) {
      return 'NIN';
    }

    return 'GEN';
  }

  private async generarCodigoProducto(nombre: string): Promise<string> {
    const prefijoCategoria = this.detectarPrefijoCategoria(nombre);
    const tipoProducto = this.detectarTipoProducto(nombre).toUpperCase();

    const total = await this.db.productos.count();

    return `DW-${prefijoCategoria}-${tipoProducto}-${String(total + 1).padStart(
      3,
      '0',
    )}`;
  }

  private includeProductoCompleto() {
    return {
      categorias: true,
      tipos_producto: true,
      producto_imagenes: {
        orderBy: [
          {
            principal: 'desc',
          },
          {
            orden: 'asc',
          },
        ],
      },
      producto_variantes: {
        include: {
          tallas: true,
        },
        orderBy: {
          created_at: 'asc',
        },
      },
    };
  }

  private async obtenerConfiguracionMostrarAgotados(): Promise<boolean> {
    try {
      const configuracion = await this.db.configuracion_tienda.findFirst();

      if (!configuracion) {
        return true;
      }

      return Boolean(configuracion.mostrar_productos_agotados);
    } catch {
      return true;
    }
  }

  private productoTieneStock(producto: any): boolean {
    const variantes = producto?.producto_variantes || [];

    if (!variantes.length) {
      return true;
    }

    return variantes.some((variante: any) => Number(variante.stock || 0) > 0);
  }

  private transformarProducto(producto: any, vendidos = 0) {
    const variantes = producto?.producto_variantes || [];
    const imagenes = producto?.producto_imagenes || [];

    const stockTotal = variantes.reduce(
      (total: number, variante: any) => total + Number(variante.stock || 0),
      0,
    );

    const imagenPrincipal =
      imagenes.find((imagen: any) => imagen.principal) || imagenes[0] || null;

    return {
      ...producto,
      vendidos,
      stock_total: stockTotal,
      agotado: variantes.length > 0 ? stockTotal <= 0 : false,
      imagen_principal: imagenPrincipal,
    };
  }

  private async obtenerVentasPorProducto(productosIds: string[]) {
    if (!productosIds.length) {
      return new Map<string, number>();
    }

    const ventas = await this.db.pedido_items.groupBy({
      by: ['producto_id'],
      where: {
        producto_id: {
          in: productosIds,
        },
        pedidos: {
          estado: {
            in: ['pagado', 'enviado', 'entregado', 'completado'],
          },
        },
      },
      _sum: {
        cantidad: true,
      },
    });

    const mapaVentas = new Map<string, number>();

    for (const venta of ventas) {
      mapaVentas.set(venta.producto_id, Number(venta._sum.cantidad || 0));
    }

    return mapaVentas;
  }

  private debeOrdenarPorMasVendidos(query: any): boolean {
    const orden = String(query.orden || query.sort || '').toLowerCase();
    const masVendidos = String(
      query.masVendidos || query.mas_vendidos || '',
    ).toLowerCase();

    return (
      orden === 'mas-vendidos' ||
      orden === 'mas_vendidos' ||
      orden === 'vendidos' ||
      masVendidos === 'true'
    );
  }

  async findAll(query: any = {}) {
    const admin = query.admin === 'true' || query.admin === true;
    const publico = query.publico === 'true' || query.publico === true;

    const buscar = String(query.buscar || '').trim();
    const genero = String(query.genero || '').trim();
    const tipo = String(query.tipo || '').trim();
    const categoria = String(query.categoria || '').trim();
    const talla = String(query.talla || '').trim();

    const ordenarPorMasVendidos = this.debeOrdenarPorMasVendidos(query);

    const precioMin =
      query.precioMin !== undefined && query.precioMin !== ''
        ? Number(query.precioMin)
        : null;

    const precioMax =
      query.precioMax !== undefined && query.precioMax !== ''
        ? Number(query.precioMax)
        : null;

    const destacado =
      query.destacado === 'true' || query.destacado === true ? true : null;

    const where: any = {};

    if (!admin) {
      where.activo = true;
    }

    if (destacado !== null) {
      where.destacado = destacado;
    }

    if (buscar) {
      where.OR = [
        {
          nombre: {
            contains: buscar,
            mode: 'insensitive',
          },
        },
        {
          descripcion: {
            contains: buscar,
            mode: 'insensitive',
          },
        },
        {
          codigo: {
            contains: buscar,
            mode: 'insensitive',
          },
        },
        {
          categorias: {
            nombre: {
              contains: buscar,
              mode: 'insensitive',
            },
          },
        },
        {
          tipos_producto: {
            nombre: {
              contains: buscar,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    if (genero) {
      where.categorias = {
        ...(where.categorias || {}),
        OR: [
          {
            nombre: {
              contains: genero,
              mode: 'insensitive',
            },
          },
          {
            slug: {
              contains: genero,
              mode: 'insensitive',
            },
          },
        ],
      };
    }

    if (categoria) {
      where.categorias = {
        ...(where.categorias || {}),
        OR: [
          {
            nombre: {
              contains: categoria,
              mode: 'insensitive',
            },
          },
          {
            slug: {
              contains: categoria,
              mode: 'insensitive',
            },
          },
        ],
      };
    }

    if (tipo) {
      where.tipos_producto = {
        OR: [
          {
            nombre: {
              contains: tipo,
              mode: 'insensitive',
            },
          },
          {
            slug: {
              contains: tipo,
              mode: 'insensitive',
            },
          },
        ],
      };
    }

    if (precioMin !== null || precioMax !== null) {
      where.precio = {};

      if (precioMin !== null && !Number.isNaN(precioMin)) {
        where.precio.gte = precioMin;
      }

      if (precioMax !== null && !Number.isNaN(precioMax)) {
        where.precio.lte = precioMax;
      }
    }

    if (talla) {
      where.producto_variantes = {
        some: {
          tallas: {
            nombre: {
              equals: talla,
              mode: 'insensitive',
            },
          },
          stock: {
            gt: 0,
          },
        },
      };
    }

    const productos = await this.db.productos.findMany({
      where,
      include: this.includeProductoCompleto(),
      orderBy: ordenarPorMasVendidos
        ? [
            {
              created_at: 'desc',
            },
          ]
        : [
            {
              destacado: 'desc',
            },
            {
              created_at: 'desc',
            },
          ],
    });

    const productosIds = productos.map((producto: any) => producto.id);
    const ventasPorProducto = await this.obtenerVentasPorProducto(productosIds);

    let productosTransformados = productos.map((producto: any) =>
      this.transformarProducto(
        producto,
        ventasPorProducto.get(producto.id) || 0,
      ),
    );

    if (ordenarPorMasVendidos) {
      productosTransformados = productosTransformados.sort((a: any, b: any) => {
        const ventasA = Number(a.vendidos || 0);
        const ventasB = Number(b.vendidos || 0);

        if (ventasB !== ventasA) {
          return ventasB - ventasA;
        }

        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
    }

    if (admin || !publico) {
      return productosTransformados;
    }

    const mostrarAgotados = await this.obtenerConfiguracionMostrarAgotados();

    if (mostrarAgotados) {
      return productosTransformados;
    }

    return productosTransformados.filter((producto: any) =>
      this.productoTieneStock(producto),
    );
  }

  async findBySlug(slug: string) {
    const producto = await this.db.productos.findFirst({
      where: {
        slug,
        activo: true,
      },
      include: this.includeProductoCompleto(),
    });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    const ventasPorProducto = await this.obtenerVentasPorProducto([producto.id]);

    return this.transformarProducto(
      producto,
      ventasPorProducto.get(producto.id) || 0,
    );
  }

  async findOne(id: string) {
    const producto = await this.db.productos.findUnique({
      where: {
        id,
      },
      include: this.includeProductoCompleto(),
    });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    const ventasPorProducto = await this.obtenerVentasPorProducto([producto.id]);

    return this.transformarProducto(
      producto,
      ventasPorProducto.get(producto.id) || 0,
    );
  }

  async create(body: any) {
    if (!body?.nombre) {
      throw new BadRequestException('El nombre del producto es obligatorio');
    }

    const slug = body.slug
      ? this.generarSlugBase(body.slug)
      : await this.generarSlugUnico(body.nombre);

    const codigo = body.codigo || (await this.generarCodigoProducto(body.nombre));

    const data: any = {
      nombre: body.nombre,
      slug,
      codigo,
      descripcion: body.descripcion || null,
      precio: Number(body.precio || 0),
      activo: body.activo !== undefined ? Boolean(body.activo) : true,
      destacado:
        body.destacado !== undefined ? Boolean(body.destacado) : false,
    };

    if (body.categoria_id || body.categoriaId) {
      data.categoria_id = body.categoria_id || body.categoriaId;
    }

    if (body.tipo_producto_id || body.tipoProductoId) {
      data.tipo_producto_id = body.tipo_producto_id || body.tipoProductoId;
    }

    const producto = await this.db.productos.create({
      data,
      include: this.includeProductoCompleto(),
    });

    if (Array.isArray(body.variantes)) {
      for (const variante of body.variantes) {
        await this.createVariante(producto.id, variante);
      }
    }

    return this.findOne(producto.id);
  }

  async update(id: string, body: any) {
  const productoActual = await this.db.productos.findUnique({
    where: { id },
  });

  if (!productoActual) {
    throw new NotFoundException('Producto no encontrado');
  }

  const data: any = {};

  if (body.nombre !== undefined) data.nombre = body.nombre;

  if (body.descripcion !== undefined) {
    data.descripcion = body.descripcion || null;
  }

  if (body.precio !== undefined) {
    data.precio = Number(body.precio || 0);
  }

  if (body.costo !== undefined) {
    data.costo = Number(body.costo || 0);
  }

  if (body.estado !== undefined) {
    const estado = String(body.estado).toLowerCase();

    data.activo =
      estado === 'activo' ||
      estado === 'true' ||
      estado === '1';
  }

  if (body.activo !== undefined) {
    data.activo =
      body.activo === true ||
      body.activo === 'true' ||
      body.activo === 1 ||
      body.activo === '1';
  }

  if (body.destacado !== undefined) {
    data.destacado =
      body.destacado === true ||
      body.destacado === 'true' ||
      body.destacado === 1 ||
      body.destacado === '1';
  }

  if (body.codigo !== undefined) {
    data.codigo = body.codigo || productoActual.codigo;
  }

  if (body.categoria_id !== undefined || body.categoriaId !== undefined) {
    data.categoria_id = body.categoria_id || body.categoriaId || null;
  }

  if (body.tipo_producto_id !== undefined || body.tipoProductoId !== undefined) {
    data.tipo_producto_id =
      body.tipo_producto_id || body.tipoProductoId || null;
  }

  if (body.slug !== undefined) {
    data.slug = await this.generarSlugUnico(body.slug || body.nombre, id);
  } else if (body.nombre && body.nombre !== productoActual.nombre) {
    data.slug = await this.generarSlugUnico(body.nombre, id);
  }

  await this.db.productos.update({
    where: { id },
    data,
  });

  if (Array.isArray(body.variantes)) {
    for (const variante of body.variantes) {
      const stock = Number(variante.stock);

      if (!Number.isFinite(stock) || stock < 0) {
        throw new BadRequestException(
          'El stock de la variante debe ser un número válido mayor o igual a 0',
        );
      }

      if (variante.id) {
        await this.db.producto_variantes.update({
          where: { id: variante.id },
          data: {
            stock,
            precio_extra: Number(
              variante.precio_extra || variante.precioExtra || 0,
            ),
            ...(variante.talla_id || variante.tallaId
              ? { talla_id: variante.talla_id || variante.tallaId }
              : {}),
            ...(variante.color_id || variante.colorId
              ? { color_id: variante.color_id || variante.colorId }
              : {}),
            ...(variante.sku !== undefined
              ? { sku: variante.sku || null }
              : {}),
          },
        });
      } else {
        await this.createVariante(id, variante);
      }
    }
  }

  return this.findOne(id);
}

  async ocultar(id: string) {
    const producto = await this.db.productos.findUnique({
      where: {
        id,
      },
    });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    await this.db.productos.update({
      where: {
        id,
      },
      data: {
        activo: false,
      },
    });

    return {
      message: 'Producto ocultado correctamente',
      id,
    };
  }

  async reactivar(id: string) {
    const producto = await this.db.productos.findUnique({
      where: {
        id,
      },
    });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    await this.db.productos.update({
      where: {
        id,
      },
      data: {
        activo: true,
      },
    });

    return {
      message: 'Producto reactivado correctamente',
      id,
    };
  }

  async createVariante(productoId: string, body: any) {
    const producto = await this.db.productos.findUnique({
      where: {
        id: productoId,
      },
    });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    const data: any = {
      producto_id: productoId,
      stock: Number(body.stock || 0),
      precio_extra: Number(body.precio_extra || body.precioExtra || 0),
    };

    if (body.talla_id || body.tallaId) {
      data.talla_id = body.talla_id || body.tallaId;
    }

    if (body.color_id || body.colorId) {
      data.color_id = body.color_id || body.colorId;
    }

    if (body.sku) {
      data.sku = body.sku;
    }

    return this.db.producto_variantes.create({
      data,
      include: {
        tallas: true,
      },
    });
  }

  async updateStockVariante(varianteId: string, stock: number) {
  const nuevoStock = Number(stock);

  if (!Number.isFinite(nuevoStock) || nuevoStock < 0) {
    throw new BadRequestException(
      'El stock debe ser un número válido mayor o igual a 0',
    );
  }

  const variante = await this.db.producto_variantes.findUnique({
    where: { id: varianteId },
  });

  if (!variante) {
    throw new NotFoundException('Variante no encontrada');
  }

  return this.db.producto_variantes.update({
    where: { id: varianteId },
    data: {
      stock: nuevoStock,
    },
    include: {
      tallas: true,
    },
  });
}

  async uploadImage(productoId: string, file: any) {
    const producto = await this.db.productos.findUnique({
      where: {
        id: productoId,
      },
    });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    if (!file) {
      throw new BadRequestException('No se recibió ninguna imagen');
    }

    const url = await this.subirImagenProducto(file);

    const totalImagenes = await this.db.producto_imagenes.count({
      where: {
        producto_id: productoId,
      },
    });

    const imagen = await this.db.producto_imagenes.create({
      data: {
        producto_id: productoId,
        url,
        alt: producto.nombre,
        principal: totalImagenes === 0,
        orden: totalImagenes + 1,
      },
    });

    return imagen;
  }

  private async subirImagenProducto(file: any): Promise<string> {
    if (!this.storageService) {
      if (file.location) {
        return file.location;
      }

      if (file.url) {
        return file.url;
      }

      if (file.path) {
        return file.path;
      }

      throw new BadRequestException(
        'StorageService no está disponible para subir imágenes',
      );
    }

    const storage: any = this.storageService;

    if (typeof storage.uploadFile === 'function') {
      const resultado = await storage.uploadFile(file, 'productos');

      if (typeof resultado === 'string') {
        return resultado;
      }

      return resultado?.url || resultado?.publicUrl || resultado?.path;
    }

    if (typeof storage.uploadImage === 'function') {
      const resultado = await storage.uploadImage(file, 'productos');

      if (typeof resultado === 'string') {
        return resultado;
      }

      return resultado?.url || resultado?.publicUrl || resultado?.path;
    }

    if (typeof storage.subirArchivo === 'function') {
      const resultado = await storage.subirArchivo(file, 'productos');

      if (typeof resultado === 'string') {
        return resultado;
      }

      return resultado?.url || resultado?.publicUrl || resultado?.path;
    }

    if (typeof storage.subirImagen === 'function') {
      const resultado = await storage.subirImagen(file, 'productos');

      if (typeof resultado === 'string') {
        return resultado;
      }

      return resultado?.url || resultado?.publicUrl || resultado?.path;
    }

    throw new BadRequestException(
      'StorageService no tiene un método válido para subir imágenes',
    );
  }

  async setImagenPrincipal(imagenId: string) {
    const imagen = await this.db.producto_imagenes.findUnique({
      where: {
        id: imagenId,
      },
    });

    if (!imagen) {
      throw new NotFoundException('Imagen no encontrada');
    }

    await this.db.producto_imagenes.updateMany({
      where: {
        producto_id: imagen.producto_id,
      },
      data: {
        principal: false,
      },
    });

    return this.db.producto_imagenes.update({
      where: {
        id: imagenId,
      },
      data: {
        principal: true,
      },
    });
  }

  async deleteImagen(imagenId: string) {
    const imagen = await this.db.producto_imagenes.findUnique({
      where: {
        id: imagenId,
      },
    });

    if (!imagen) {
      throw new NotFoundException('Imagen no encontrada');
    }

    await this.db.producto_imagenes.delete({
      where: {
        id: imagenId,
      },
    });

    const imagenesRestantes = await this.db.producto_imagenes.findMany({
      where: {
        producto_id: imagen.producto_id,
      },
      orderBy: {
        orden: 'asc',
      },
    });

    if (imagen.principal && imagenesRestantes.length > 0) {
      await this.db.producto_imagenes.update({
        where: {
          id: imagenesRestantes[0].id,
        },
        data: {
          principal: true,
        },
      });
    }

    return {
      message: 'Imagen eliminada correctamente',
      id: imagenId,
    };
  }

  async updateOrdenImagen(imagenId: string, orden: number) {
    const imagen = await this.db.producto_imagenes.findUnique({
      where: {
        id: imagenId,
      },
    });

    if (!imagen) {
      throw new NotFoundException('Imagen no encontrada');
    }

    return this.db.producto_imagenes.update({
      where: {
        id: imagenId,
      },
      data: {
        orden: Number(orden || 1),
      },
    });
  }

  async findRelacionados(id: string) {
    const producto = await this.db.productos.findUnique({
      where: {
        id,
      },
    });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    const relacionados = await this.db.productos.findMany({
      where: {
        id: {
          not: id,
        },
        activo: true,
        OR: [
          {
            categoria_id: producto.categoria_id,
          },
          {
            tipo_producto_id: producto.tipo_producto_id,
          },
        ],
      },
      include: this.includeProductoCompleto(),
      take: 8,
      orderBy: {
        created_at: 'desc',
      },
    });

    const productosIds = relacionados.map((relacionado: any) => relacionado.id);
    const ventasPorProducto = await this.obtenerVentasPorProducto(productosIds);

    return relacionados
      .map((relacionado: any) =>
        this.transformarProducto(
          relacionado,
          ventasPorProducto.get(relacionado.id) || 0,
        ),
      )
      .sort((a: any, b: any) => Number(b.vendidos || 0) - Number(a.vendidos || 0));
  }
}
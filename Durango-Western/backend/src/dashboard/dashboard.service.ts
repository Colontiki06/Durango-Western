import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerResumen() {
    const ahora = new Date();

    const inicioDia = new Date(
      ahora.getFullYear(),
      ahora.getMonth(),
      ahora.getDate(),
    );

    const inicioMes = new Date(
      ahora.getFullYear(),
      ahora.getMonth(),
      1,
    );

    const [
      ventasMes,
      ventasHoy,
      pedidosPagados,
      pedidosPendientes,
      pedidosEnviados,
      pedidosEntregados,
      productosActivos,
      stockBajo,
      productosStockBajo,
      ultimosPedidos,
      itemsVendidos,
    ] = await Promise.all([
      this.prisma.pedidos.aggregate({
        where: {
          estado: 'pagado',
          created_at: {
            gte: inicioMes,
          },
        },
        _sum: {
          total: true,
        },
      }),

      this.prisma.pedidos.aggregate({
        where: {
          estado: 'pagado',
          created_at: {
            gte: inicioDia,
          },
        },
        _sum: {
          total: true,
        },
      }),

      this.prisma.pedidos.count({
        where: {
          estado: 'pagado',
        },
      }),

      this.prisma.pedidos.count({
        where: {
          estado_envio: 'pendiente',
        },
      }),

      this.prisma.pedidos.count({
        where: {
          estado_envio: 'enviado',
        },
      }),

      this.prisma.pedidos.count({
        where: {
          estado_envio: 'entregado',
        },
      }),

      this.prisma.productos.count({
        where: {
          activo: true,
        },
      }),

      this.prisma.producto_variantes.count({
        where: {
          activo: true,
          stock: {
            lte: 3,
          },
        },
      }),

      this.prisma.producto_variantes.findMany({
  where: {
    activo: true,
    stock: {
      lte: 3,
    },
  },
  take: 5,
  orderBy: {
    stock: 'asc',
  },
  include: {
    productos: true,
    tallas: true,
    colores: true,
  },
}),

      this.prisma.pedidos.findMany({
        take: 5,
        orderBy: {
          created_at: 'desc',
        },
        include: {
          pedido_items: true,
          pagos: true,
        },
      }),

      this.prisma.pedido_items.groupBy({
        by: ['nombre_producto'],
        _sum: {
          cantidad: true,
        },
        orderBy: {
          _sum: {
            cantidad: 'desc',
          },
        },
        take: 1,
      }),
    ]);

    let productoMasVendido: any = null;

    if (itemsVendidos.length > 0) {
      const nombreProducto = itemsVendidos[0].nombre_producto;

      const itemProducto = await this.prisma.pedido_items.findFirst({
        where: {
          nombre_producto: nombreProducto,
        },
        include: {
          productos: {
            include: {
              producto_imagenes: {
                where: {
                  principal: true,
                },
                take: 1,
              },
            },
          },
        },
      });

      productoMasVendido = {
        nombre_producto: nombreProducto,
        cantidad_vendida: Number(itemsVendidos[0]._sum.cantidad ?? 0),
        imagen_url:
          itemProducto?.productos?.producto_imagenes?.[0]?.imagen_url ?? null,
        producto_id: itemProducto?.producto_id ?? null,
      };
    }

    return {
  ventasMes: Number(ventasMes._sum.total ?? 0),
  ventasHoy: Number(ventasHoy._sum.total ?? 0),
  pedidosPagados,
  pedidosPendientes,
  pedidosEnviados,
  pedidosEntregados,
  productosActivos,
  stockBajo,
  productosStockBajo: productosStockBajo.map((variante) => ({
    id: variante.id,
    producto: variante.productos?.nombre ?? 'Producto sin nombre',
    talla: variante.tallas?.nombre ?? 'N/A',
    color: variante.colores?.nombre ?? 'N/A',
    stock: variante.stock ?? 0,
    sku: variante.sku ?? 'N/A',
  })),
  productoMasVendido,
  ultimosPedidos,
};
  }

 async obtenerVentasMesActual() {
  const hoy = new Date();

  const inicioMes = new Date(
    hoy.getFullYear(),
    hoy.getMonth(),
    1,
  );

  const finMes = new Date(
    hoy.getFullYear(),
    hoy.getMonth() + 1,
    0,
  );

  const pedidos = await this.prisma.pedidos.findMany({
    where: {
      estado: 'pagado',
      created_at: {
        gte: inicioMes,
      },
    },
    select: {
      total: true,
      created_at: true,
    },
    orderBy: {
      created_at: 'asc',
    },
  });

  const ventasPorDia = new Map<string, number>();

  const diasMes = finMes.getDate();

  for (let dia = 1; dia <= diasMes; dia++) {
    const fecha = new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      dia,
    );

    const key = fecha.toISOString().slice(0, 10);

    ventasPorDia.set(key, 0);
  }

  for (const pedido of pedidos) {
    if (!pedido.created_at) continue;

    const key = pedido.created_at.toISOString().slice(0, 10);

    const totalActual = ventasPorDia.get(key) ?? 0;

    ventasPorDia.set(
      key,
      totalActual + Number(pedido.total ?? 0),
    );
  }

  return Array.from(ventasPorDia.entries()).map(
    ([fecha, ventas]) => {
      const date = new Date(fecha + 'T00:00:00');

      return {
        fecha,
        label: date.toLocaleDateString('es-MX', {
          day: '2-digit',
        }),
        ventas,
      };
    },
  );
}

}
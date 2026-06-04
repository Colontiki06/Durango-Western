import { StorageModule } from './storage/storage.module';
import { PrismaModule } from './prisma/prisma.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

// AUTH
import { AuthModule } from './auth/auth.module';

// USUARIOS
import { UsuariosModule } from './usuarios/usuarios.module';
import { RolesModule } from './roles/roles.module';

// CATÁLOGO
import { ProductosModule } from './productos/productos.module';
import { MarcasModule } from './marcas/marcas.module';
import { VariantesProductosModule } from './variantes-productos/variantes-productos.module';
import { AtributosModule } from './atributos/atributos.module';

// INVENTARIO
import { InventarioModule } from './inventario/inventario.module';
import { SucursalesModule } from './sucursales/sucursales.module';

// ECOMMERCE
import { CarritoModule } from './carrito/carrito.module';
import { PedidosModule } from './pedidos/pedidos.module';
import { PagosModule } from './pagos/pagos.module';
import { EnviosModule } from './envios/envios.module';

// MARKETING
import { PromocionesModule } from './promociones/promociones.module';
import { CuponesModule } from './cupones/cupones.module';

// CMS
import { BannersModule } from './banners/banners.module';
import { PaginasModule } from './paginas/paginas.module';
import { ConfiguracionesModule } from './configuraciones/configuraciones.module';

// AUDITORÍA
import { AuditoriaModule } from './auditoria/auditoria.module';
import { TallasModule } from './tallas/tallas.module';
import { CategoriasModule } from './categorias/categorias.module';

@Module({
  imports: [

    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // PRISMA
    PrismaModule,

    // AUTH
    AuthModule,

    // USUARIOS
    UsuariosModule,
    RolesModule,

    // CATÁLOGO
    ProductosModule,
    CategoriasModule,
    MarcasModule,
    VariantesProductosModule,
    AtributosModule,

    // INVENTARIO
    InventarioModule,
    SucursalesModule,

    // ECOMMERCE
    CarritoModule,
    PedidosModule,
    PagosModule,
    EnviosModule,
    PedidosModule,
    PagosModule,
    EnviosModule,

    // MARKETING
    PromocionesModule,
    CuponesModule,

    // CMS
    BannersModule,
    PaginasModule,
    ConfiguracionesModule,

    // AUDITORÍA
    AuditoriaModule,

    StorageModule,

    TallasModule,

  ],

  controllers: [AppController],

  providers: [AppService],
})
export class AppModule {}
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { StorageModule } from './storage/storage.module';
import { PrismaModule } from './prisma/prisma.module';

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
import { TallasModule } from './tallas/tallas.module';
import { CategoriasModule } from './categorias/categorias.module';

// INVENTARIO
import { InventarioModule } from './inventario/inventario.module';
import { SucursalesModule } from './sucursales/sucursales.module';

// ECOMMERCE
import { CarritoModule } from './carrito/carrito.module';
import { PedidosModule } from './pedidos/pedidos.module';
import { PagosModule } from './pagos/pagos.module';
import { EnviosModule } from './envios/envios.module';
import { DireccionesModule } from './direcciones/direcciones.module';

// MARKETING
import { PromocionesModule } from './promociones/promociones.module';
import { CuponesModule } from './cupones/cupones.module';
import { PersonalizarInicioModule } from './personalizar-inicio/personalizar-inicio.module';

// CORREOS
import { CorreosModule } from './correos/correos.module';

// CMS
import { BannersModule } from './banners/banners.module';
import { PaginasModule } from './paginas/paginas.module';
import { ConfiguracionesModule } from './configuraciones/configuraciones.module';

// AUDITORÍA
import { AuditoriaModule } from './auditoria/auditoria.module';

// TIENDAS
import { TiendasModule } from './tiendas/tiendas.module';

// GOOGLE MAPS CONFIG
import { GoogleMapsConfigModule } from './google-maps-config/google-maps-config.module';

// DASHBOARD
import { DashboardModule } from './dashboard/dashboard.module';

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
    TallasModule,

    // INVENTARIO
    InventarioModule,
    SucursalesModule,

    // ECOMMERCE
    CarritoModule,
    PedidosModule,
    PagosModule,
    EnviosModule,
    DireccionesModule,

    // MARKETING
    PromocionesModule,
    CuponesModule,
    PersonalizarInicioModule,

    // CORREOS
    CorreosModule,

    // CMS
    BannersModule,
    PaginasModule,
    ConfiguracionesModule,

    // AUDITORÍA
    AuditoriaModule,

    // STORAGE
    StorageModule,

    // TIENDAS
    TiendasModule,

    // GOOGLE MAPS CONFIG
    GoogleMapsConfigModule,

    // DASHBOARD
    DashboardModule,
  ],

  controllers: [AppController],

  providers: [AppService],
})
export class AppModule {}
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';

// AUTH
import { AuthModule } from './auth/auth.module';

// USUARIOS
import { UsuariosModule } from './usuarios/usuarios.module';
import { RolesModule } from './roles/roles.module';

// CATÁLOGO
import { ProductosModule } from './productos/productos.module';
import { CategoriasModule } from './categorias/categorias.module';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',

      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,

      entities: [__dirname + '/**/*.entity{.ts,.js}'],

      synchronize: false,

      logging: process.env.NODE_ENV !== 'production',

      autoLoadEntities: true,

      ssl:
        process.env.NODE_ENV === 'production'
          ? {
              rejectUnauthorized: false,
            }
          : false,
    }),

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

    // MARKETING
    PromocionesModule,
    CuponesModule,

    // CMS
    BannersModule,
    PaginasModule,
    ConfiguracionesModule,

    // AUDITORÍA
    AuditoriaModule,
  ],

  controllers: [AppController],

  providers: [AppService],
})
export class AppModule {}
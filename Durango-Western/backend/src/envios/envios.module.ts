import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { EnviosService } from './envios.service';
import { EnviosController } from './envios.controller';

@Module({
  imports: [
    HttpModule,
  ],
  providers: [
    EnviosService,
  ],
  controllers: [
    EnviosController,
  ],
})
export class EnviosModule {}
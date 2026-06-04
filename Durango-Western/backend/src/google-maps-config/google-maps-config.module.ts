import { Module } from '@nestjs/common';
import { GoogleMapsConfigController } from './google-maps-config.controller';

@Module({
  controllers: [GoogleMapsConfigController],
})
export class GoogleMapsConfigModule {}
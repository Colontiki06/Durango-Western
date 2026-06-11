import { Controller, Get, InternalServerErrorException } from '@nestjs/common';

@Controller('config')
export class GoogleMapsConfigController {
  @Get('google-maps')
  getGoogleMapsConfig() {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      throw new InternalServerErrorException(
        'Google Maps API Key no configurada en el backend.'
      );
    }

    return {
      apiKey,
    };
  }
}
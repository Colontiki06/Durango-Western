import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';

declare global {
  interface Window {
    googleMapsScriptLoading?: Promise<void>;
  }
}

@Injectable({
  providedIn: 'root',
})
export class GoogleMapsLoaderService {
  private readonly scriptId = 'google-maps-script';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  async load(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if ((window as any).google?.maps) {
      return;
    }

    const scriptExistente = document.getElementById(this.scriptId);

    if (scriptExistente && window.googleMapsScriptLoading) {
      return window.googleMapsScriptLoading;
    }

    if (window.googleMapsScriptLoading) {
      return window.googleMapsScriptLoading;
    }

    window.googleMapsScriptLoading = this.cargarScript();

    return window.googleMapsScriptLoading;
  }

  private async cargarScript(): Promise<void> {
    const config = await firstValueFrom(
      this.http.get<{ apiKey: string }>(
        `${environment.apiUrl}/config/google-maps`
      )
    );

    return new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');

      script.id = this.scriptId;
      script.async = true;
      script.defer = true;

      script.src =
        `https://maps.googleapis.com/maps/api/js?key=${config.apiKey}&libraries=places`;

      script.onload = () => {
        resolve();
      };

      script.onerror = () => {
        reject('No se pudo cargar Google Maps.');
      };

      document.head.appendChild(script);
    });
  }
}
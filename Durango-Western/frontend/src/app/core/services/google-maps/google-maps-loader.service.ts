import { Injectable } from '@angular/core';
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

  constructor(private http: HttpClient) {}

  async load(): Promise<void> {
    if (typeof google !== 'undefined' && google.maps && google.maps.places) {
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
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
        config.apiKey
      )}&libraries=places&loading=async`;

      script.onload = () => resolve();

      script.onerror = () => {
        reject('No se pudo cargar Google Maps.');
      };

      document.head.appendChild(script);
    });
  }
}
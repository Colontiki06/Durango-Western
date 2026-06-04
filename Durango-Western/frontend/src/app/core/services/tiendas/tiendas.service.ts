import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Tienda {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  postal_code?: string;
  phone?: string;
  schedule?: string;
  lat: number;
  lng: number;
  is_active: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class TiendasService {
  private apiUrl = `${environment.apiUrl}/tiendas`;

  constructor(private http: HttpClient) {}

  getTiendas(): Observable<Tienda[]> {
    return this.http.get<Tienda[]>(this.apiUrl);
  }
}
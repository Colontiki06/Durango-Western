import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private http = inject(HttpClient);

  private apiUrl = environment.apiUrl;

  get<T>(endpoint: string, params?: HttpParams) {
    return this.http.get<T>(
      `${this.apiUrl}/${endpoint}`,
      { params }
    );
  }

  post<T>(endpoint: string, body: unknown) {
    return this.http.post<T>(
      `${this.apiUrl}/${endpoint}`,
      body
    );
  }

  put<T>(endpoint: string, body: unknown) {
    return this.http.put<T>(
      `${this.apiUrl}/${endpoint}`,
      body
    );
  }

  delete<T>(endpoint: string) {
    return this.http.delete<T>(
      `${this.apiUrl}/${endpoint}`
    );
  }
}
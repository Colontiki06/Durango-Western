import { inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { ApiService } from '../api/api.service';
import { StorageService } from '../storage/storage.service';

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: string;
    nombre: string;
    email: string;
    rol?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiService = inject(ApiService);
  private storageService = inject(StorageService);

  private readonly TOKEN_KEY = 'dw_token';
  private readonly USER_KEY = 'dw_user';

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  login(data: LoginRequest) {
    return this.apiService.post<AuthResponse>('auth/login', data);
  }

  saveSession(response: AuthResponse): void {
    this.storageService.setItem(this.TOKEN_KEY, response.token);
    this.storageService.setItem(this.USER_KEY, response.user);
    this.isAuthenticatedSubject.next(true);
  }

  logout(): void {
    this.storageService.removeItem(this.TOKEN_KEY);
    this.storageService.removeItem(this.USER_KEY);
    this.isAuthenticatedSubject.next(false);
  }

  getToken(): string | null {
    return this.storageService.getItem<string>(this.TOKEN_KEY);
  }

  getUser<T>(): T | null {
    return this.storageService.getItem<T>(this.USER_KEY);
  }

  isAuthenticated(): boolean {
    return this.hasToken();
  }

  private hasToken(): boolean {
    return !!this.storageService.getItem<string>(this.TOKEN_KEY);
  }
}
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../../environments/environment';

export interface UsuarioSesion {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  loggedIn: boolean;
  loginAt: string;
  token: string;
  telefono?: string | null;
  avatar_url?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    nombre: string;
    email: string;
    rol: string;
    telefono?: string | null;
    avatar_url?: string | null;
  };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  nombre: string;
  email: string;
  password: string;
}

export interface ActualizarPerfilPayload {
  nombre: string;
  telefono?: string | null;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordResponse {
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly storageKey = 'durango_western_user';
  private readonly tokenKey = 'durango_western_token';

  private readonly apiAuthUrl = `${environment.apiUrl}/auth`;
  private readonly apiUsuariosUrl = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<AuthResponse> {
    const payload: LoginPayload = {
      email: email.trim().toLowerCase(),
      password,
    };

    return this.http.post<AuthResponse>(`${this.apiAuthUrl}/login`, payload).pipe(
      tap((response) => {
        this.guardarSesion(response);
      }),
    );
  }

  register(
    nombre: string,
    email: string,
    password: string
  ): Observable<AuthResponse> {
    const payload: RegisterPayload = {
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      password,
    };

    return this.http.post<AuthResponse>(`${this.apiAuthUrl}/register`, payload).pipe(
      tap((response) => {
        this.guardarSesion(response);
      }),
    );
  }

  forgotPassword(email: string): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(
      `${this.apiAuthUrl}/forgot-password`,
      {
        email: email.trim().toLowerCase(),
        frontendUrl: this.obtenerFrontendUrlActual(),
      }
    );
  }

  resetPassword(token: string, password: string): Observable<ResetPasswordResponse> {
    return this.http.post<ResetPasswordResponse>(
      `${this.apiAuthUrl}/reset-password`,
      {
        token,
        password,
      }
    );
  }

  me(): Observable<UsuarioSesion> {
    return this.http.get<UsuarioSesion>(
      `${this.apiAuthUrl}/me?t=${Date.now()}`,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  obtenerMiPerfil(): Observable<UsuarioSesion> {
    return this.http
      .get<UsuarioSesion>(`${this.apiUsuariosUrl}/me?t=${Date.now()}`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        tap((usuarioBackend) => {
          this.guardarUsuarioDesdeBackend(usuarioBackend);
        }),
      );
  }

  actualizarPerfil(data: ActualizarPerfilPayload): Observable<UsuarioSesion> {
    return this.http
      .put<UsuarioSesion>(
        `${this.apiUsuariosUrl}/me?t=${Date.now()}`,
        data,
        {
          headers: this.getAuthHeaders(),
        }
      )
      .pipe(
        tap((usuarioActualizado) => {
          this.guardarUsuarioDesdeBackend(usuarioActualizado);
        }),
      );
  }

  logout(): void {
    if (!this.storageDisponible()) {
      return;
    }

    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    if (!this.storageDisponible()) {
      return false;
    }

    return !!this.getToken();
  }

  getUser(): UsuarioSesion | null {
    if (!this.storageDisponible()) {
      return null;
    }

    const usuarioGuardado = localStorage.getItem(this.storageKey);

    if (!usuarioGuardado) {
      return null;
    }

    try {
      return JSON.parse(usuarioGuardado) as UsuarioSesion;
    } catch {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }

  getToken(): string | null {
    if (!this.storageDisponible()) {
      return null;
    }

    return localStorage.getItem(this.tokenKey);
  }

  updateUser(data: Partial<UsuarioSesion>): void {
    if (!this.storageDisponible()) {
      return;
    }

    const token = this.getToken();

    if (!token) {
      return;
    }

    const usuarioActual = this.getUser();

    const usuarioActualizado: UsuarioSesion = {
      id: data.id || usuarioActual?.id || '',
      email: data.email || usuarioActual?.email || '',
      nombre: data.nombre || usuarioActual?.nombre || '',
      rol: data.rol || usuarioActual?.rol || 'cliente',
      telefono:
        data.telefono !== undefined
          ? data.telefono
          : usuarioActual?.telefono || null,
      avatar_url:
        data.avatar_url !== undefined
          ? data.avatar_url
          : usuarioActual?.avatar_url || null,
      loggedIn: true,
      loginAt: usuarioActual?.loginAt || new Date().toISOString(),
      token,
    };

    localStorage.setItem(this.storageKey, JSON.stringify(usuarioActualizado));
    localStorage.setItem(this.tokenKey, token);
  }

  guardarUsuarioDesdeBackend(usuarioBackend: Partial<UsuarioSesion>): void {
    const token = this.getToken();

    if (!token) {
      return;
    }

    const usuarioActual = this.getUser();

    const usuario: UsuarioSesion = {
      id: usuarioBackend.id || usuarioActual?.id || '',
      nombre: usuarioBackend.nombre || usuarioActual?.nombre || '',
      email: usuarioBackend.email || usuarioActual?.email || '',
      rol: usuarioBackend.rol || usuarioActual?.rol || 'cliente',
      telefono:
        usuarioBackend.telefono !== undefined
          ? usuarioBackend.telefono
          : usuarioActual?.telefono || null,
      avatar_url:
        usuarioBackend.avatar_url !== undefined
          ? usuarioBackend.avatar_url
          : usuarioActual?.avatar_url || null,
      loggedIn: true,
      loginAt: usuarioActual?.loginAt || new Date().toISOString(),
      token,
    };

    localStorage.setItem(this.storageKey, JSON.stringify(usuario));
    localStorage.setItem(this.tokenKey, token);
  }

  private guardarSesion(response: AuthResponse): void {
    if (!this.storageDisponible()) {
      return;
    }

    const usuario: UsuarioSesion = {
      id: response.user.id,
      email: response.user.email,
      nombre: response.user.nombre,
      rol: response.user.rol,
      loggedIn: true,
      loginAt: new Date().toISOString(),
      token: response.accessToken,
      telefono: response.user.telefono || null,
      avatar_url: response.user.avatar_url || null,
    };

    localStorage.setItem(this.storageKey, JSON.stringify(usuario));
    localStorage.setItem(this.tokenKey, response.accessToken);
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  private obtenerFrontendUrlActual(): string {
    if (typeof window === 'undefined') {
      return '';
    }

    return window.location.origin;
  }

  private storageDisponible(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof window.localStorage !== 'undefined'
    );
  }
}
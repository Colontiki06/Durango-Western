import { Injectable } from '@angular/core';

export interface UsuarioSesion {
  email: string;
  loggedIn: boolean;
  loginAt: string;
  token: string;
  nombre?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly storageKey = 'durango_western_user';
  private readonly tokenKey = 'durango_western_token';

  login(email: string, password: string): boolean {
    const correo = email.trim();

    if (!correo || !password.trim()) {
      return false;
    }

    const usuarioExistente = this.getUser();
    const tokenTemporal = usuarioExistente?.token || `demo-token-${Date.now()}`;

    const usuario: UsuarioSesion = {
      email: correo,
      loggedIn: true,
      loginAt: new Date().toISOString(),
      token: tokenTemporal,
      nombre: usuarioExistente?.nombre || 'Sin nombre registrado',
    };

    localStorage.setItem(this.storageKey, JSON.stringify(usuario));
    localStorage.setItem(this.tokenKey, tokenTemporal);

    return true;
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    const usuarioGuardado = localStorage.getItem(this.storageKey);
    const token = this.getToken();

    if (!usuarioGuardado || !token) {
      return false;
    }

    try {
      const usuario = JSON.parse(usuarioGuardado) as UsuarioSesion;
      return usuario.loggedIn === true;
    } catch {
      this.logout();
      return false;
    }
  }

  getUser(): UsuarioSesion | null {
    const usuarioGuardado = localStorage.getItem(this.storageKey);

    if (!usuarioGuardado) {
      return null;
    }

    try {
      return JSON.parse(usuarioGuardado) as UsuarioSesion;
    } catch {
      this.logout();
      return null;
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  updateUser(data: Partial<UsuarioSesion>): void {
    const usuarioActual = this.getUser();

    if (!usuarioActual) {
      return;
    }

    const usuarioActualizado: UsuarioSesion = {
      ...usuarioActual,
      ...data,
    };

    localStorage.setItem(this.storageKey, JSON.stringify(usuarioActualizado));

    if (usuarioActualizado.token) {
      localStorage.setItem(this.tokenKey, usuarioActualizado.token);
    }
  }
}
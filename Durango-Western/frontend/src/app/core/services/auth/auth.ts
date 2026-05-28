import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private readonly tokenKey = 'durango_token';

  isLoggedIn(): boolean {
    if (!this.isBrowser()) {
      return false;
    }

    return !!localStorage.getItem(this.tokenKey);
  }

  login(): void {
    if (!this.isBrowser()) {
      return;
    }

    localStorage.setItem(this.tokenKey, 'mock-token');
  }

  logout(): void {
    if (!this.isBrowser()) {
      return;
    }

    localStorage.removeItem(this.tokenKey);
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }
}
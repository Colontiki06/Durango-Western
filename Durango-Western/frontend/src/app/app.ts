import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import { Navbar } from './layout/components/navbar/navbar';
import { Footer } from './layout/components/footer/footer';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Durango-Western');

  private router = inject(Router);

  get isAdminRoute(): boolean {
    return this.router.url.startsWith('/admin');
  }
}
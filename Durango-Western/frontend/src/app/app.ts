import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { Navbar } from './layout/components/navbar/navbar';
import { Footer } from './layout/components/footer/footer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Navbar, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

  private router = inject(Router);

  currentUrl = '';

  constructor() {
    this.currentUrl = this.router.url;

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentUrl = event.urlAfterRedirects;
        console.log('RUTA ACTUAL:', this.currentUrl);
      });
  }

  isAdminRoute(): boolean {
    return this.currentUrl.startsWith('/admin');
  }
}
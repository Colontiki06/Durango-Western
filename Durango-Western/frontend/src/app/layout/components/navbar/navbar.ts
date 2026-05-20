import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { Auth } from '../../../core/services/auth';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar {

  cartCount = 0;

  searchOpen = false;
  userMenuOpen = false;

  constructor(
    private router: Router,
    public auth: Auth,
    private cartService: CartService
  ) {
    this.cartService.cartItems$.subscribe(() => {
      this.cartCount = this.cartService.getTotalItems();
    });
  }

  toggleSearch(): void {
    this.searchOpen = !this.searchOpen;
    this.userMenuOpen = false;
  }

 goToUserArea(): void {
  if (!this.auth.isLoggedIn()) {
    this.router.navigate(['/login']);
    return;
  }

  this.userMenuOpen = !this.userMenuOpen;
  this.searchOpen = false;
}

  goTo(path: string): void {
    this.userMenuOpen = false;
    this.router.navigate([path]);
  }

 logout(): void {
  this.auth.logout();
  this.router.navigate(['/login']);
}

}
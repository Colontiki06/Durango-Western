import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-admin',
  imports: [],
  templateUrl: './login-admin.html',
  styleUrl: './login-admin.css'
})
export class LoginAdmin {
  private router = inject(Router);

  login(): void {
    localStorage.setItem('admin_logged', 'true');
    this.router.navigate(['/admin/dashboard']);
  }
}
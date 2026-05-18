import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../core/services/auth';

@Component({
  selector: 'app-login',
  imports: [RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  email = '';
  password = '';

  constructor(
    private router: Router,
    private auth: Auth
  ) {}

  login(): void {
    this.auth.login();
    this.router.navigate(['/perfil']);
  }
}
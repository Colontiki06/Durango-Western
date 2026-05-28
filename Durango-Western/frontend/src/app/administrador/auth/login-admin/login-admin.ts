import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/auth/supabase.service';

@Component({
  selector: 'app-login-admin',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login-admin.html',
  styleUrl: './login-admin.css'
})
export class LoginAdmin {

  private router = inject(Router);
  private supabaseService = inject(SupabaseService);

  email = '';
  password = '';
  loading = false;
  error = '';

  async login(): Promise<void> {
    this.loading = true;
    this.error = '';

    const { data, error } = await this.supabaseService.signIn(
      this.email,
      this.password
    );

    if (error || !data.user) {
      this.error = 'Correo o contraseña incorrectos';
      this.loading = false;
      return;
    }

    const { data: profile, error: profileError } =
      await this.supabaseService.client
        .from('profiles')
        .select('rol, activo')
        .eq('id', data.user.id)
        .single();

    if (profileError || !profile) {
      await this.supabaseService.signOut();
      this.error = 'Perfil no encontrado';
      this.loading = false;
      return;
    }

    if (profile.rol !== 'admin' || !profile.activo) {
      await this.supabaseService.signOut();
      this.error = 'No tienes permisos de administrador';
      this.loading = false;
      return;
    }

    this.loading = false;
    this.router.navigate(['/admin/dashboard']);
  }
}
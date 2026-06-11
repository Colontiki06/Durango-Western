import { Component, ChangeDetectorRef, inject } from '@angular/core';
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
  private cdr = inject(ChangeDetectorRef);
  private supabaseService = inject(SupabaseService);

  email = '';
  password = '';
  loading = false;
  error = '';

  mostrarPassword = false;

  togglePassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  async login(): Promise<void> {
    if (this.loading) return;

    if (!this.email.trim() || !this.password.trim()) {
      this.error = 'Ingresa correo y contraseña';
      return;
    }

    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();

    try {
      const { data, error } = await this.supabaseService.signIn(
        this.email.trim(),
        this.password
      );

      if (error || !data?.user) {
        this.error = 'Correo o contraseña incorrectos';
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
        return;
      }

      if (profile.rol !== 'admin') {
        await this.supabaseService.signOut();
        this.error = 'No tienes permisos de administrador';
        return;
      }

      if (!profile.activo) {
        await this.supabaseService.signOut();
        this.error = 'Tu cuenta está desactivada';
        return;
      }

      await this.router.navigate(['/admin/dashboard']);

    } catch (err) {
      console.error('Error login:', err);
      this.error = 'No se pudo iniciar sesión. Intenta nuevamente.';
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
}
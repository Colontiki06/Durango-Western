import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SupabaseService } from '../services/auth/supabase.service';

export const adminGuard: CanActivateFn = async () => {

  const router = inject(Router);
  const supabaseService = inject(SupabaseService);

  // OBTENER SESIÓN
  const { data: sessionData } =
    await supabaseService.getSession();

  const session = sessionData.session;

  // SI NO HAY SESIÓN
  if (!session) {

    router.navigate(['/admin/login']);

    return false;
  }

  // OBTENER PROFILE
  const { data: profile, error } =
    await supabaseService.client
      .from('profiles')
      .select('rol, activo')
      .eq('id', session.user.id)
      .single();

  // SI HAY ERROR
  if (error || !profile) {

    await supabaseService.signOut();

    router.navigate(['/admin/login']);

    return false;
  }

  // VALIDAR ADMIN
  if (
    profile.rol !== 'admin' ||
    !profile.activo
  ) {

    await supabaseService.signOut();

    router.navigate(['/admin/login']);

    return false;
  }

  return true;
};
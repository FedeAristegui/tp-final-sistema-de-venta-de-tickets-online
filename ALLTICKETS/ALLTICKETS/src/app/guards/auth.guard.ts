import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  const usuarioData = localStorage.getItem('usuarioLogueado');

  if (!usuarioData) {
    router.navigate(['/login']);
    return false;
  }

  return true;
};
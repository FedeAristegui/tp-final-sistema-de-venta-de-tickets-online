import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const clienteGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  const usuarioData = localStorage.getItem('usuarioLogueado');

  if (!usuarioData) {
    router.navigate(['/login']);
    return false;
  }

  const usuario = JSON.parse(usuarioData);

  if (usuario.rol === 'admin') {
    router.navigate(['/menu-principal']);
    return false;
  }

  return true;
};
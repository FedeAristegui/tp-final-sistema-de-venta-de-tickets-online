import { CanDeactivateFn } from '@angular/router';
import {AdminEventos} from '../Evento/admin-eventos/crear-evento/admin-eventos';

export const formIncompletoGuard: CanDeactivateFn<AdminEventos> = (component, currentRoute, currentState, nextState) => {
  // Accede al formulario usando la propiedad correcta
  if (component['form']?.dirty) {
    return confirm('Desea salir sin guardar?');
  }
  return true;
};
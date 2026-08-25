import { CanDeactivateFn } from '@angular/router';
import { inject } from '@angular/core';
// Sólo se usa como tipo: con un import normal, el guard (que es eager por estar
// en las rutas) arrastraría el componente entero al bundle inicial.
import type { AdminEventos } from '../Evento/crear-evento/admin-eventos';
import { ModalConfirmacionService } from '../servicios/modal-confirmacion.service';

export const formIncompletoGuard: CanDeactivateFn<AdminEventos> = async (component, currentRoute, currentState, nextState) => {
  const modalService = inject(ModalConfirmacionService);
  
  // Accede al formulario usando la propiedad correcta
  if (component['form']?.dirty) {
    const confirmar = await modalService.confirm('¿Desea salir sin guardar?');
    return confirmar;
  }
  return true;
};
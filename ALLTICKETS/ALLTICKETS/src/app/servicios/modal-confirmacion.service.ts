import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ModalConfirmacionService {

  showConfirmModal = signal<boolean>(false);
  confirmMessage = signal<string>('');

  private resolveConfirm: ((value: boolean) => void) | null = null;

  showErrorModal = signal<boolean>(false);
  errorMessage = signal<string>('');

  private resolveError: (() => void) | null = null;

  constructor() {}

  confirm(mensaje: string): Promise<boolean> {
    // Si ya había una confirmación abierta se resuelve como cancelada antes de
    // pisarla. Antes su `resolve` se perdía, así que quien la estaba esperando
    // quedaba colgado para siempre y la navegación que venía después nunca
    // llegaba a ejecutarse.
    this.resolveConfirm?.(false);
    this.resolveConfirm = null;

    return new Promise((resolve) => {
      this.confirmMessage.set(mensaje);
      this.showConfirmModal.set(true);
      this.resolveConfirm = resolve;
    });
  }

  confirmAction(): void {
    this.cerrarConfirmacion(true);
  }

  cancelAction(): void {
    this.cerrarConfirmacion(false);
  }

  /* El modal se cierra siempre, haya o no alguien esperando la respuesta: si el
     `resolve` ya no estaba, antes quedaba visible y su fondo seguía tapando la
     cabecera. */
  private cerrarConfirmacion(valor: boolean): void {
    this.resolveConfirm?.(valor);
    this.resolveConfirm = null;
    this.showConfirmModal.set(false);
    this.confirmMessage.set('');
  }

  notify(mensaje: string): Promise<void> {
    // Mismo cuidado que en `confirm`: dos avisos seguidos (por ejemplo, si
    // fallan a la vez la carga de eventos y la de favoritos) dejaban la primera
    // promesa sin resolver.
    this.resolveError?.();
    this.resolveError = null;

    return new Promise((resolve) => {
      this.errorMessage.set(mensaje);
      this.showErrorModal.set(true);
      this.resolveError = resolve;
    });
  }

  closeErrorModal(): void {
    this.resolveError?.();
    this.resolveError = null;
    this.showErrorModal.set(false);
    this.errorMessage.set('');
  }

  /**
   * Cierre por gesto (click fuera del cuadro o tecla Escape). Una confirmación
   * se descarta como "cancelar", que es la opción segura.
   */
  descartar(): void {
    if (this.showConfirmModal()) {
      this.cancelAction();
    } else if (this.showErrorModal()) {
      this.closeErrorModal();
    }
  }
}

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

  private cerrarConfirmacion(valor: boolean): void {
    this.resolveConfirm?.(valor);
    this.resolveConfirm = null;
    this.showConfirmModal.set(false);
    this.confirmMessage.set('');
  }

  notify(mensaje: string): Promise<void> {
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

  descartar(): void {
    if (this.showConfirmModal()) {
      this.cancelAction();
    } else if (this.showErrorModal()) {
      this.closeErrorModal();
    }
  }
}

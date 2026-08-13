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
    return new Promise((resolve) => {
      this.confirmMessage.set(mensaje);
      this.showConfirmModal.set(true);
      this.resolveConfirm = resolve;
    });
  }

  confirmAction(): void {
    if (this.resolveConfirm) {
      this.resolveConfirm(true);
      this.closeModal();
    }
  }

  cancelAction(): void {
    if (this.resolveConfirm) {
      this.resolveConfirm(false);
      this.closeModal();
    }
  }

  private closeModal(): void {
    this.showConfirmModal.set(false);
    this.confirmMessage.set('');
    this.resolveConfirm = null;
  }

  notify(mensaje: string): Promise<void> {
    return new Promise((resolve) => {
      this.errorMessage.set(mensaje);
      this.showErrorModal.set(true);
      this.resolveError = resolve;
    });
  }

  closeErrorModal(): void {
    if (this.resolveError) {
      this.resolveError();
    }
    this.showErrorModal.set(false);
    this.errorMessage.set('');
    this.resolveError = null;
  }
}

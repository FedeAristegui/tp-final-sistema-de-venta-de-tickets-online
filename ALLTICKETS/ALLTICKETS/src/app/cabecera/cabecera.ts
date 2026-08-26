import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Autenticador } from '../servicios/autenticador';
import { ModalConfirmacionService } from '../servicios/modal-confirmacion.service';
import { Icono } from '../ui/icono';

@Component({
  selector: 'app-cabecera',
  imports: [RouterLink, RouterLinkActive, CommonModule, Icono],
  templateUrl: './cabecera.html',
  styleUrl: './cabecera.css',
})
export class Cabecera implements OnInit {
  usuario: any = null;
  favoritosUsuario: string[] = [];
  protected readonly router = inject(Router);
  protected readonly client = inject(Autenticador);
  protected readonly modalService = inject(ModalConfirmacionService);
  protected readonly user = this.client.obtenerUsuarioActual();

  /** Menú desplegable en pantallas angostas. En escritorio la nav está siempre visible. */
  protected readonly menuAbierto = signal(false);

  protected alternarMenu() {
    this.menuAbierto.update((abierto) => !abierto);
  }

  /** Al navegar, el panel móvil se cierra solo: si no, tapa la pantalla de destino. */
  protected cerrarMenu() {
    this.menuAbierto.set(false);
  }

  /**
   * Escape cierra el modal que esté abierto. Su fondo cubre toda la ventana
   * —cabecera incluida—, así que mientras siga visible ningún link del menú
   * recibe el click. Sin una salida por teclado o por click afuera, un modal
   * que quedara abierto dejaba la navegación entera bloqueada.
   */
  @HostListener('document:keydown.escape')
  protected descartarModal() {
    this.modalService.descartar();
  }

  async cerrarSesion() {
    this.cerrarMenu();
    // Dispara el canDeactivate (formIncompletoGuard) si hay un formulario sin guardar
    const navego = await this.router.navigate(['/']);
    if (!navego) {
      return; // el usuario canceló la salida en el popup de confirmación
    }
    if (this.user?.id) {
      this.client.actualizarActividad(this.user.id).subscribe();
    }
    localStorage.removeItem('usuarioLogueado');
    // Recarga completa: así todas las páginas (no solo la cabecera) dejan de mostrar
    // opciones de usuario logueado (ej. marcar favoritos) sin esperar un refresh manual
    window.location.href = '/menu-principal';
  }

  ngOnInit() {
    const data = localStorage.getItem('usuarioLogueado');
    this.usuario = data ? JSON.parse(data) : null;
  }
}

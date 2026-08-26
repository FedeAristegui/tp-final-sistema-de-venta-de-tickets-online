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

  protected readonly menuAbierto = signal(false);

  protected alternarMenu() {
    this.menuAbierto.update((abierto) => !abierto);
  }

  protected cerrarMenu() {
    this.menuAbierto.set(false);
  }

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
    window.location.href = '/menu-principal';
  }

  ngOnInit() {
    const data = localStorage.getItem('usuarioLogueado');
    this.usuario = data ? JSON.parse(data) : null;
  }
}

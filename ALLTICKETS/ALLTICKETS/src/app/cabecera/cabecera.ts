import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Autenticador } from '../servicios/autenticador';
import { ModalConfirmacionService } from '../servicios/modal-confirmacion.service';

@Component({
  selector: 'app-cabecera',
  imports: [RouterLink, CommonModule],
  templateUrl: './cabecera.html',
  styleUrl: './cabecera.css',
})
export class Cabecera implements OnInit{
  usuario: any = null;
  favoritosUsuario: string[] = [];
  protected readonly router = inject(Router);
  protected readonly client = inject(Autenticador);
  protected readonly modalService = inject(ModalConfirmacionService);
  protected readonly user = this.client.obtenerUsuarioActual();
  
  async cerrarSesion() {
  // Dispara el canDeactivate (formIncompletoGuard) si hay un formulario sin guardar
  const navego = await this.router.navigate(['/']);
  if (!navego) {
    return; // el usuario canceló la salida en el popup de confirmación
  }
  localStorage.removeItem('usuarioLogueado');
  this.usuario = null;
  this.favoritosUsuario = [];
  if (this.user) {
    this.user.ultimaActividad = Date.now().toString();
  }
  this.client.actualizarActividad(this.user?.id || '').subscribe();
  }

    ngOnInit() {
    const data = localStorage.getItem('usuarioLogueado');
    this.usuario = data ? JSON.parse(data) : null;
    }
}
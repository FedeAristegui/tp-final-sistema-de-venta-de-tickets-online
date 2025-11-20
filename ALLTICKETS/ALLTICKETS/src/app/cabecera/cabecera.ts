import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Autenticador } from '../servicios/autenticador';

@Component({
  selector: 'app-cabecera',
  imports: [RouterLink],
  templateUrl: './cabecera.html',
  styleUrl: './cabecera.css',
})
export class Cabecera implements OnInit{
  usuario: any = null;
  favoritosUsuario: string[] = [];
  protected readonly router = inject(Router);
  protected readonly client = inject(Autenticador);
  protected readonly user = this.client.obtenerUsuarioActual();
  cerrarSesion() {
  localStorage.removeItem('usuarioLogueado');
  this.usuario = null;
  this.favoritosUsuario = [];
  this.router.navigate(['/']);
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
import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

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

  cerrarSesion() {
  localStorage.removeItem('usuarioLogueado');
  this.usuario = null;
  this.favoritosUsuario = [];
  this.router.navigate(['/']);
  }

    ngOnInit() {
    const data = localStorage.getItem('usuarioLogueado');
    this.usuario = data ? JSON.parse(data) : null;
    console.log('[PaginaPrincipal] ngOnInit - usuario:', this.usuario);
    }
}

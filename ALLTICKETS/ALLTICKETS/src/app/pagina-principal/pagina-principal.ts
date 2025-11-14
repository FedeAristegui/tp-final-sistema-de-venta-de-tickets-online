import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pagina-principal',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './pagina-principal.html',
  styleUrls: ['./pagina-principal.css']
})
export class PaginaPrincipal implements OnInit {
  usuario: any = null;

ngOnInit() {
  const data = localStorage.getItem('usuarioLogueado');
  this.usuario = data ? JSON.parse(data) : null;
}
cerrarSesion() {
  localStorage.removeItem('usuarioLogueado');
  this.usuario = null;

  // Opcional: redirigir a otra ruta (ej: al inicio)
  this.router.navigate(['/']);
}
constructor(private router: Router) {}

navegarAPerfil(){
  const id = this.usuario?.id;
  if (!id) {
    this.router.navigate(['/login']);
    return;
  }
  this.router.navigate(['/perfil', id]);
}


}


import { Component, OnInit, inject } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { EventoServicio } from '../servicios/evento.servicio';
import { Evento } from '../modelos/evento';
// Diagnostics: keep imports minimal for now

@Component({
  selector: 'app-pagina-principal',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './pagina-principal.html',
  styleUrls: ['./pagina-principal.css']
})
export class PaginaPrincipal implements OnInit {
  usuario: any = null;
  eventos: Evento[] = [];
  isLoading = true;

  private readonly eventoService = inject(EventoServicio);
  private readonly router = inject(Router);
  ngOnInit() {
    const data = localStorage.getItem('usuarioLogueado');
    this.usuario = data ? JSON.parse(data) : null;
    console.log('[PaginaPrincipal] ngOnInit - usuario:', this.usuario);
    this.cargarEventos();
  }


  cargarEventos(): void {
    this.isLoading = true;
    console.log('[PaginaPrincipal] cargarEventos: iniciando petición');
    this.eventoService.obtenerEventos().subscribe({
      next: (eventos) => {
        console.log('[PaginaPrincipal] cargarEventos: eventos recibidos', eventos);
        this.eventos = eventos;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar eventos:', err);
        this.isLoading = false;
      }
    });
  }

  cerrarSesion() {
    localStorage.removeItem('usuarioLogueado');
    this.usuario = null;
    this.router.navigate(['/']);
  }

  verDetalleEvento(id: number | undefined): void {
    if (id) {
      this.router.navigate(['/ficha-evento', id]);
    }
  }
}
import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FavoritoServicio } from '../servicios/favorito.servicio';
import { EventoServicio } from '../servicios/evento.servicio';
import { Evento } from '../modelos/evento';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-lista-favoritos',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './lista-favoritos.html',
  styleUrls: ['./lista-favoritos.css']
})
export class ListaFavoritos implements OnInit {
  usuario: any = null;
  eventosFavoritos = signal<Evento[]>([]);
  isLoading = signal(true);

  private readonly favoritoService = inject(FavoritoServicio);
  private readonly eventoService = inject(EventoServicio);
  private readonly router = inject(Router);

  ngOnInit() {
    const data = localStorage.getItem('usuarioLogueado');
    this.usuario = data ? JSON.parse(data) : null;

    if (!this.usuario) {
      alert('Debes iniciar sesión para ver tus favoritos');
      this.router.navigate(['/login']);
      return;
    }

    this.cargarFavoritos();
  }

  cargarFavoritos(): void {
    this.isLoading.set(true);

    this.favoritoService.obtenerFavoritosPorUsuario(this.usuario.id).subscribe({
      next: (favoritos) => {
        
        
        if (favoritos.length === 0) {
          this.eventosFavoritos.set([]);
          this.isLoading.set(false);
          return;
        }

        // se cargan los detalles de cada evento favorito
        const eventosObservables = favoritos.map(fav => this.eventoService.obtenerEvento(fav.eventoId));

        forkJoin(eventosObservables).subscribe({
          next: (eventos) => {
            this.eventosFavoritos.set(eventos);
            this.isLoading.set(false);
          },
          error: (err) => {
            this.eventosFavoritos.set([]);
            this.isLoading.set(false);
          }
        });
      },
      error: (err) => {
        this.eventosFavoritos.set([]);
        this.isLoading.set(false);
      }
    });
  }

  quitarFavorito(eventoId: number | undefined): void {
    if (!eventoId) return;

    this.favoritoService.verificarFavorito(this.usuario.id, String(eventoId)).subscribe({
      next: (favoritos) => {
        if (favoritos.length > 0 && favoritos[0].id) {
          this.favoritoService.eliminarFavorito(favoritos[0].id).subscribe({
            next: () => {
              this.eventosFavoritos.update(eventos => eventos.filter(e => e.id !== eventoId));
            },
            error: (err) => {}
          });
        }
      }
    });
  }

  verDetalleEvento(id: number | undefined): void {
    if (id) {
      this.router.navigate(['/ficha-evento', id]);
    }
  }
}

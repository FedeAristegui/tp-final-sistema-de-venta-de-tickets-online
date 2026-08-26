import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FavoritoServicio } from '../servicios/favorito.servicio';
import { EventoServicio } from '../servicios/evento.servicio';
import { ModalConfirmacionService } from '../servicios/modal-confirmacion.service';
import { Evento } from '../modelos/evento';
import { Icono } from '../ui/icono';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-lista-favoritos',
  standalone: true,
  imports: [CommonModule, RouterModule, Icono],
  templateUrl: './lista-favoritos.html',
  styleUrls: ['./lista-favoritos.css']
})
export class ListaFavoritos implements OnInit {
  usuario: any = null;
  eventosFavoritos = signal<Evento[]>([]);
  isLoading = signal(true);

  /**
   * `eventoId -> id del favorito`, guardado al cargar la lista. Sin esto había
   * que releer toda la colección de favoritos para poder borrar uno.
   */
  private favoritosPorEvento = new Map<string, string>();

  private readonly favoritoService = inject(FavoritoServicio);
  private readonly eventoService = inject(EventoServicio);
  private readonly modalService = inject(ModalConfirmacionService);
  private readonly router = inject(Router);

  async ngOnInit() {
    const data = localStorage.getItem('usuarioLogueado');
    this.usuario = data ? JSON.parse(data) : null;

    if (!this.usuario) {
      await this.modalService.notify('Debes iniciar sesión para ver tus favoritos');
      this.router.navigate(['/login']);
      return;
    }

    this.cargarFavoritos();
  }

  cargarFavoritos(): void {
    this.isLoading.set(true);

    this.favoritoService.obtenerFavoritosPorUsuario(this.usuario.id).subscribe({
      next: (favoritos) => {
        this.favoritosPorEvento = new Map(
          favoritos.filter(f => f.id).map(f => [String(f.eventoId), f.id!])
        );

        if (favoritos.length === 0) {
          this.eventosFavoritos.set([]);
          this.isLoading.set(false);
          return;
        }

        // se cargan los detalles de cada evento favorito. Un favorito puede apuntar
        // a un evento ya eliminado (404): se descarta ese solo, antes tiraba abajo
        // la lista entera.
        const eventosObservables = favoritos.map(fav =>
          this.eventoService.obtenerEvento(fav.eventoId).pipe(catchError(() => of(null)))
        );

        forkJoin(eventosObservables).subscribe({
          next: (eventos) => {
            this.eventosFavoritos.set(eventos.filter((e): e is Evento => e !== null));
            this.isLoading.set(false);
          },
          error: (err) => {
            this.eventosFavoritos.set([]);
            this.isLoading.set(false);
            this.modalService.notify('No se pudieron cargar tus eventos favoritos. Intenta nuevamente en unos minutos.');
          }
        });
      },
      error: (err) => {
        this.eventosFavoritos.set([]);
        this.isLoading.set(false);
        this.modalService.notify('No se pudieron cargar tus favoritos. Intenta nuevamente en unos minutos.');
      }
    });
  }

  quitarFavorito(eventoId: number | undefined): void {
    if (!eventoId) return;

    const favoritoId = this.favoritosPorEvento.get(String(eventoId));
    if (!favoritoId) return;

    this.favoritoService.eliminarFavorito(favoritoId).subscribe({
      next: () => {
        this.favoritosPorEvento.delete(String(eventoId));
        this.eventosFavoritos.update(eventos => eventos.filter(e => e.id !== eventoId));
      },
      error: (err) => {
        this.modalService.notify('No se pudo quitar el favorito. Intenta nuevamente en unos minutos.');
      }
    });
  }

  verDetalleEvento(id: number | undefined): void {
    if (id) {
      this.router.navigate(['/ficha-evento', id]);
    }
  }
}

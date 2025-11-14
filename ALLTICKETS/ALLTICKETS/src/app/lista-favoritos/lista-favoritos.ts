import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
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
  eventosFavoritos: Evento[] = [];
  isLoading = true;

  private readonly favoritoService = inject(FavoritoServicio);
  private readonly eventoService = inject(EventoServicio);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

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
    this.isLoading = true;
    console.log('[ListaFavoritos] Iniciando carga de favoritos para usuario:', this.usuario.id);

    this.favoritoService.obtenerFavoritosPorUsuario(this.usuario.id).subscribe({
      next: (favoritos) => {
        console.log('[ListaFavoritos] Favoritos recibidos:', favoritos);
        
        if (favoritos.length === 0) {
          console.log('[ListaFavoritos] No hay favoritos');
          this.eventosFavoritos = [];
          this.isLoading = false;
          this.cdr.detectChanges(); // Forzar detección de cambios
          return;
        }

        // Cargar detalles de cada evento favorito
        const eventosObservables = favoritos.map(fav => {
          console.log('[ListaFavoritos] Cargando evento:', fav.eventoId);
          return this.eventoService.obtenerEvento(fav.eventoId);
        });

        forkJoin(eventosObservables).subscribe({
          next: (eventos) => {
            console.log('[ListaFavoritos] Eventos cargados:', eventos);
            this.eventosFavoritos = eventos;
            this.isLoading = false;
            this.cdr.detectChanges(); // Forzar detección de cambios
          },
          error: (err) => {
            console.error('[ListaFavoritos] Error al cargar eventos favoritos:', err);
            this.eventosFavoritos = [];
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        console.error('[ListaFavoritos] Error al cargar favoritos:', err);
        this.eventosFavoritos = [];
        this.isLoading = false;
        this.cdr.detectChanges();
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
              this.eventosFavoritos = this.eventosFavoritos.filter(e => e.id !== eventoId);
              console.log('Favorito eliminado');
            },
            error: (err) => console.error('Error al eliminar favorito:', err)
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

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { Favorito } from '../modelos/favorito';
import { Evento } from '../modelos/evento';
import { EventoServicio } from './evento.servicio';

@Injectable({
  providedIn: 'root'
})
export class FavoritoServicio {
  private urlBase = 'http://localhost:3000/favoritos';

  constructor(
    private http: HttpClient,
    private eventoServicio: EventoServicio
  ) {}

  obtenerFavoritos(): Observable<Favorito[]> {
    return this.http.get<Favorito[]>(this.urlBase);
  }

  obtenerFavoritosPorUsuario(usuarioId: string): Observable<Favorito[]> {
    return this.http.get<Favorito[]>(`${this.urlBase}?usuarioId=${usuarioId}`);
  }

  obtenerEventosFavoritos(usuarioId: string): Observable<Evento[]> {
    return this.obtenerFavoritosPorUsuario(usuarioId).pipe(
      map(favoritos => {
        if (favoritos.length === 0) return [];
        
        const eventosObservables = favoritos.map(fav => 
          this.eventoServicio.obtenerEvento(fav.eventoId)
        );
        
        return forkJoin(eventosObservables);
      }),
      map(eventos => eventos as unknown as Evento[])
    );
  }

  verificarFavorito(usuarioId: string, eventoId: number | string): Observable<Favorito[]> {
    return this.http.get<Favorito[]>(`${this.urlBase}?usuarioId=${usuarioId}&eventoId=${eventoId}`);
  }

  agregarFavorito(favorito: Favorito): Observable<Favorito> {
    return this.http.post<Favorito>(this.urlBase, {
      ...favorito,
      id: this.generarId(),
      fechaAgregado: new Date().toISOString()
    });
  }

  eliminarFavorito(id: string): Observable<void> {
    return this.http.delete<void>(`${this.urlBase}/${id}`);
  }

  private generarId(): string {
    return Math.random().toString(36).substring(2, 9);
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Favorito } from '../modelos/favorito';
import { coincideCon } from './filtro-backend';

@Injectable({
  providedIn: 'root'
})
export class FavoritoServicio {
  private urlBase = 'http://localhost:3000/favoritos';

  constructor(private http: HttpClient) {}

  obtenerFavoritos(): Observable<Favorito[]> {
    return this.http.get<Favorito[]>(this.urlBase);
  }

  obtenerFavoritosPorUsuario(usuarioId: string): Observable<Favorito[]> {
    // Se filtra en el cliente (ver filtro-backend.ts): con `?usuarioId=` la lista de
    // favoritos volvía vacía aunque el usuario tuviera eventos marcados.
    return this.obtenerFavoritos().pipe(
      map(favoritos => (favoritos ?? []).filter(f => coincideCon(f, { usuarioId })))
    );
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

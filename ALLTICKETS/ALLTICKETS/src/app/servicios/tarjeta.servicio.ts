import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Tarjeta } from '../modelos/tarjeta';
import { coincideCon } from './filtro-backend';

@Injectable({
  providedIn: 'root'
})
export class TarjetaServicio {
  private urlBase = 'http://localhost:3000/tarjetas';

  constructor(private http: HttpClient) {}

  obtenerTarjetas(): Observable<Tarjeta[]> {
    return this.http.get<Tarjeta[]>(this.urlBase);
  }

  obtenerTarjetasPorUsuario(usuarioId: string): Observable<Tarjeta[]> {
    // Se filtra en el cliente (ver filtro-backend.ts): con `?usuarioId=` el usuario
    // veía "no tenés tarjetas" aunque las tuviera guardadas.
    return this.obtenerTarjetas().pipe(
      map(tarjetas => (tarjetas ?? []).filter(t => coincideCon(t, { usuarioId })))
    );
  }

  obtenerTarjeta(id: string): Observable<Tarjeta> {
    return this.http.get<Tarjeta>(`${this.urlBase}/${id}`);
  }

  agregarTarjeta(tarjeta: Tarjeta): Observable<Tarjeta> {
    return this.http.post<Tarjeta>(this.urlBase, {
      ...tarjeta,
      id: this.generarId(),
      fechaAgregada: new Date().toISOString()
    });
  }

  actualizarTarjeta(tarjeta: Tarjeta): Observable<Tarjeta> {
    return this.http.put<Tarjeta>(`${this.urlBase}/${tarjeta.id}`, tarjeta);
  }

  eliminarTarjeta(id: string): Observable<void> {
    return this.http.delete<void>(`${this.urlBase}/${id}`);
  }

  private generarId(): string {
    return Math.random().toString(36).substring(2, 9);
  }
}

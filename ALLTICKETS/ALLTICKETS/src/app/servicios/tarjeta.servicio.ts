import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tarjeta } from '../modelos/tarjeta';

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
    return this.http.get<Tarjeta[]>(`${this.urlBase}?usuarioId=${usuarioId}`);
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

  establecerTarjetaPrincipal(usuarioId: string, tarjetaId: string): Observable<any> {
    
    return this.obtenerTarjetasPorUsuario(usuarioId);
  }

  private generarId(): string {
    return Math.random().toString(36).substring(2, 9);
  }
}

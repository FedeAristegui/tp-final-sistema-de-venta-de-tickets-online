import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Evento } from '../models/evento';

@Injectable({
  providedIn: 'root'
})
export class EventoServicio {
  private urlBase = 'http://localhost:3000/eventos';  // ajustá el endpoint

  constructor(private http: HttpClient) {}

  obtenerEventos(): Observable<Evento[]> {
    return this.http.get<Evento[]>(this.urlBase);
  }

  obtenerEvento(id: number): Observable<Evento> {
    return this.http.get<Evento>(`${this.urlBase}/${id}`);
  }

  crearEvento(evento: Evento): Observable<Evento> {
    return this.http.post<Evento>(this.urlBase, evento);
  }

  actualizarEvento(evento: Evento): Observable<Evento> {
    return this.http.put<Evento>(`${this.urlBase}/${evento.id}`, evento);
  }

  borrarEvento(id: number): Observable<void> {
    return this.http.delete<void>(`${this.urlBase}/${id}`);
  }
}

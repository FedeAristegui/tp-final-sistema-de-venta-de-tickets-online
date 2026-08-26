import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Evento } from '../modelos/evento';

@Injectable({
  providedIn: 'root'
})
export class EventoServicio {
  private urlBase = 'http://localhost:3000/eventos';

  constructor(private http: HttpClient) {}

  obtenerEventos(): Observable<Evento[]> {
    return this.http.get<Evento[]>(this.urlBase);
  }

  obtenerEvento(id: number|string): Observable<Evento> {
    return this.http.get<Evento>(`${this.urlBase}/${id}`);
  }

  crearEvento(evento: Evento){
    return this.http.post<Evento>(this.urlBase, evento);
  }

  actualizarEvento(evento: Evento, id: string|number){
    return this.http.put<Evento>(`${this.urlBase}/${id}`, evento);
  }

  borrarEvento(id: number|string): Observable<void> {
    return this.http.delete<void>(`${this.urlBase}/${id}`);
  }

  ajustarCapacidadSectores(eventoId: number|string, cambios: { nombre: string; delta: number }[]): Observable<Evento> {
    return this.obtenerEvento(eventoId).pipe(
      switchMap(evento => {
        cambios.forEach(cambio => {
          const sectorIndex = evento.sectores.findIndex(s => s.nombre === cambio.nombre);
          if (sectorIndex !== -1) {
            const capacidad = evento.sectores[sectorIndex].capacidad + cambio.delta;
            evento.sectores[sectorIndex].capacidad = Math.max(0, capacidad);
          }
        });
        return this.actualizarEvento(evento, eventoId);
      })
    );
  }

  actualizarDisponibilidadButacas(eventoId: number|string, cambios: { fila: string; numero: number; disponible: boolean }[]): Observable<Evento> {
    return this.obtenerEvento(eventoId).pipe(
      switchMap(evento => {
        cambios.forEach(cambio => {
          const butacaIndex = evento.butacas.findIndex(b => b.fila === cambio.fila && b.numero === cambio.numero);
          if (butacaIndex !== -1) {
            evento.butacas[butacaIndex].disponible = cambio.disponible;
          }
        });
        return this.actualizarEvento(evento, eventoId);
      })
    );
  }
}

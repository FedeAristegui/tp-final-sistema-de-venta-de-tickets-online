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

  actualizarEvento(evento: Evento, id:string|number){
    return this.http.put<Evento>(`${this.urlBase}/${evento.id}`, evento);
  }

  borrarEvento(id: number|string): Observable<void> {
    return this.http.delete<void>(`${this.urlBase}/${id}`);
  }

  actualizarDisponibilidadButaca(eventoId: number|string, fila: string, numero: number, disponible: boolean): Observable<Evento> {
    return this.obtenerEvento(eventoId).pipe(
      switchMap(evento => {
        const butacaIndex = evento.butacas.findIndex(b => b.fila === fila && b.numero === numero);
        if (butacaIndex !== -1) {
          evento.butacas[butacaIndex].disponible = disponible;
        }
        return this.actualizarEvento(evento, String(eventoId));
      })
    );
  }
}

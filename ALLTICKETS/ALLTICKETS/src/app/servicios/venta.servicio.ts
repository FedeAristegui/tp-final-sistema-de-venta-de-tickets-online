import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, catchError, of } from 'rxjs';
import { Venta, EstadisticaEvento } from '../modelos/venta';
import { Evento } from '../modelos/evento';

@Injectable({
  providedIn: 'root'
})
export class VentaServicio {
  private readonly http = inject(HttpClient);
  private readonly urlBase = 'http://localhost:3000';

  obtenerVentas(): Observable<Venta[]> {
    return this.http.get<Venta[]>(`${this.urlBase}/ventas`);
  }

  obtenerVentasPorEvento(eventoId: number): Observable<Venta[]> {
    return this.http.get<Venta[]>(`${this.urlBase}/ventas?eventoId=${eventoId}`);
  }

  crearVenta(venta: Venta): Observable<Venta> {
    return this.http.post<Venta>(`${this.urlBase}/ventas`, venta);
  }

  obtenerEstadisticas(): Observable<EstadisticaEvento[]> {
    console.log('Iniciando carga de estadísticas...');
    
    return forkJoin({
      ventas: this.http.get<Venta[]>(`${this.urlBase}/ventas`).pipe(
        catchError(err => {
          console.error('Error al obtener ventas:', err);
          return of([]);
        })
      ),
      eventos: this.http.get<Evento[]>(`${this.urlBase}/eventos`).pipe(
        catchError(err => {
          console.error('Error al obtener eventos:', err);
          return of([]);
        })
      )
    }).pipe(
      map(({ ventas, eventos }) => {
        console.log('Ventas recibidas:', ventas);
        console.log('Eventos recibidos:', eventos);
        
        if (!eventos || eventos.length === 0) {
          console.warn('No hay eventos disponibles');
          return [];
        }

        return eventos.map(evento => {
          // Comparar IDs de forma flexible (string o number)
          const ventasEvento = ventas.filter(v => String(v.eventoId) === String(evento.id));
          const totalVendidas = ventasEvento.reduce((sum, v) => sum + (v.cantidad || 0), 0);
          const totalRecaudado = ventasEvento.reduce((sum, v) => sum + (v.total || 0), 0);

          // Calcular capacidad total
          let capacidadTotal = 0;
          if (evento.modoVenta === 'sector' && evento.sectores) {
            capacidadTotal = evento.sectores.reduce((sum, s) => sum + (s.capacidad || 0), 0);
          } else if (evento.butacas) {
            capacidadTotal = evento.butacas.length;
          }

          const porcentajeOcupacion = capacidadTotal > 0 
            ? (totalVendidas / capacidadTotal) * 100 
            : 0;

          // Agrupar detalles de ventas
          let detalleVentas: any = {};

          if (evento.modoVenta === 'butaca' && ventasEvento.length > 0) {
            // Agrupar butacas vendidas por fila
            const butacasMap = new Map<string, Set<number>>();
            ventasEvento.forEach(venta => {
              if (venta.butacasVendidas && Array.isArray(venta.butacasVendidas)) {
                venta.butacasVendidas.forEach(b => {
                  if (!butacasMap.has(b.fila)) {
                    butacasMap.set(b.fila, new Set());
                  }
                  butacasMap.get(b.fila)!.add(b.numero);
                });
              }
            });

            if (butacasMap.size > 0) {
              detalleVentas.butacas = Array.from(butacasMap.entries()).map(([fila, numeros]) => ({
                fila,
                numero: 0,
                cantidad: numeros.size
              }));
            }
          } else if (evento.modoVenta === 'sector' && ventasEvento.length > 0) {
            // Agrupar sectores vendidos
            const sectoresMap = new Map<string, number>();
            ventasEvento.forEach(venta => {
              if (venta.sectoresVendidos && Array.isArray(venta.sectoresVendidos)) {
                venta.sectoresVendidos.forEach(s => {
                  sectoresMap.set(s.nombre, (sectoresMap.get(s.nombre) || 0) + (s.cantidad || 0));
                });
              }
            });

            if (sectoresMap.size > 0) {
              detalleVentas.sectores = Array.from(sectoresMap.entries()).map(([nombre, cantidad]) => ({
                nombre,
                cantidad
              }));
            }
          }

          return {
            eventoId: evento.id!,
            eventoTitulo: evento.titulo,
            totalVendidas,
            totalRecaudado,
            porcentajeOcupacion,
            capacidadTotal,
            detalleVentas
          };
        });
      }),
      catchError(err => {
        console.error('Error en el procesamiento:', err);
        return of([]);
      })
    );
  }
}

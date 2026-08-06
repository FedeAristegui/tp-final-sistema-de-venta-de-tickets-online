import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, switchMap, map, catchError } from 'rxjs';
import { Evento } from '../modelos/evento';
import { Carrito } from '../modelos/carrito';
import { EventoServicio } from './evento.servicio';

export interface ItemCarrito {
  evento: Evento;
  cantidad: number;
  tipoEntrada: 'sector' | 'butaca';
  detalleEntrada: string;
  precioUnitario: number;
  addedAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CarritoServicio {
  private itemsCarrito = signal<ItemCarrito[]>([]);
  private urlBase = 'http://localhost:3000/carritos';
  
  constructor(private http: HttpClient, private eventoServicio: EventoServicio) {
    this.cargarCarritoDesdeLocalStorage();
  }

  obtenerItems() {
    return this.itemsCarrito.asReadonly();
  }

  // reemplaza el contenido local del carrito
  setItemsDirect(items: ItemCarrito[]) {
    this.itemsCarrito.set(items);
    this.guardarCarritoEnLocalStorage();
  }

  agregarAlCarrito(item: ItemCarrito): void {
    const items = this.itemsCarrito();

    const indiceExistente = items.findIndex(
      i => i.evento.id === item.evento.id && 
           i.detalleEntrada === item.detalleEntrada
    );

    if (indiceExistente !== -1) {
      // Si es butaca, no incrementa la cantidad
      if (item.tipoEntrada === 'butaca') {
        return;
      }
      // Si es sector, incrementa la cantidad
      const nuevosItems = [...items];
      nuevosItems[indiceExistente].cantidad += item.cantidad;
      this.itemsCarrito.set(nuevosItems);
    } else {
      this.itemsCarrito.set([...items, item]);
    }

    this.guardarCarritoEnLocalStorage();
  }

  eliminarDelCarrito(index: number): void {
    const items = this.itemsCarrito();
    this.itemsCarrito.set(items.filter((_, i) => i !== index));
    this.guardarCarritoEnLocalStorage();
  }

  actualizarCantidad(index: number, cantidad: number): void {
    if (cantidad <= 0) {
      this.eliminarDelCarrito(index);
      return;
    }

    const items = this.itemsCarrito();
    const nuevosItems = [...items];
    nuevosItems[index].cantidad = cantidad;
    this.itemsCarrito.set(nuevosItems);
    this.guardarCarritoEnLocalStorage();
  }

  vaciarCarrito(): void {
    this.itemsCarrito.set([]);
    this.guardarCarritoEnLocalStorage();
  }

  
  obtenerCarritos(): Observable<Carrito[]> {
    return this.http.get<Carrito[]>(this.urlBase);
  }

  obtenerCarritosPorUsuario(usuarioId: string): Observable<Carrito[]> {
    return this.http.get<Carrito[]>(`${this.urlBase}?usuarioId=${usuarioId}`);
  }

  obtenerCarritoPorUsuario(usuarioId: string): Observable<Carrito | null> {
    return this.obtenerCarritosPorUsuario(usuarioId).pipe(
      map(list => (list && list.length > 0) ? list[0] : null),
      catchError(() => of(null))
    );
  }

  agregarCarrito(carrito: Carrito): Observable<Carrito> {
    return this.http.post<Carrito>(this.urlBase, carrito);
  }

  actualizarCarrito(id: string, carrito: Carrito): Observable<Carrito> {
    return this.http.put<Carrito>(`${this.urlBase}/${id}`, carrito);
  }

  eliminarCarrito(id: string): Observable<void> {
    return this.http.delete<void>(`${this.urlBase}/${id}`);
  }

  
  sincronizarConServidor(usuarioId: string): Observable<Carrito> {
    const itemsLocal = this.itemsCarrito();
    type CarritoItem = {
      eventoId: string;
      cantidad: number;
      tipoEntrada: 'sector' | 'butaca';
      detalleEntrada: string;
      precioUnitario: number;
      addedAt?: string;
    };

    const backendItems: CarritoItem[] = itemsLocal.map(i => ({
      eventoId: String(i.evento.id),
      cantidad: i.cantidad,
      tipoEntrada: i.tipoEntrada,
      detalleEntrada: i.detalleEntrada,
      precioUnitario: i.precioUnitario,
      addedAt: i.addedAt || new Date().toISOString()
    }));

    const payload: Carrito = {
      usuarioId,
      items: backendItems,
      fechaActualizacion: new Date().toISOString()
    };

    return this.obtenerCarritoPorUsuario(usuarioId).pipe(
      switchMap(existing => {
        if (existing && existing.id) {
          return this.actualizarCarrito(existing.id, { ...payload, id: existing.id });
        } else {
         
          const toCreate: Carrito = { ...payload };
          return this.agregarCarrito(toCreate);
        }
      })
    );
  }

  calcularTotal(): number {
    return this.itemsCarrito().reduce(
      (total, item) => total + (item.precioUnitario * item.cantidad),
      0
    );
  }

  obtenerCantidadTotal(): number {
    return this.itemsCarrito().reduce(
      (total, item) => total + item.cantidad,
      0
    );
  }

  // Método para marcar butacas como no disponibles cuando se agregan al carrito
  marcarButacasComoNoDisponibles(eventoId: number|string, butacas: { fila: string; numero: number }[]): Observable<any> {
    const requests = butacas.map(butaca => 
      this.eventoServicio.actualizarDisponibilidadButaca(eventoId, butaca.fila, butaca.numero, false)
    );
    
    if (requests.length === 0) {
      return of(null);
    }
    
    // Ejecutar todas las peticiones en paralelo
    return requests.length === 1 
      ? requests[0] 
      : requests[0]; // Para simplificar, hacemos uno a uno
  }

  // Método para desmarcar butacas (marcarlas como disponibles) cuando se sacan del carrito
  desmarcarButacas(eventoId: number|string, butacas: { fila: string; numero: number }[]): Observable<any> {
    const requests = butacas.map(butaca => 
      this.eventoServicio.actualizarDisponibilidadButaca(eventoId, butaca.fila, butaca.numero, true)
    );
    
    if (requests.length === 0) {
      return of(null);
    }
    
    // Ejecutar todas las peticiones en paralelo
    return requests.length === 1 
      ? requests[0] 
      : requests[0]; // Para simplificar, hacemos uno a uno
  }

  private guardarCarritoEnLocalStorage(): void {
    localStorage.setItem('carrito', JSON.stringify(this.itemsCarrito()));
  }

  private cargarCarritoDesdeLocalStorage(): void {
    const carritoGuardado = localStorage.getItem('carrito');
    if (carritoGuardado) {
      try {
        const items = JSON.parse(carritoGuardado);
        this.itemsCarrito.set(items);
      } catch (error) {
        this.itemsCarrito.set([]);
      }
    }
  }
}

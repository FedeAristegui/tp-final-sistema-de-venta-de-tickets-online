import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, switchMap, map, catchError } from 'rxjs';
import { Evento } from '../modelos/evento';
import { Carrito } from '../modelos/carrito';
import { EventoServicio } from './evento.servicio';
import { coincideCon } from './filtro-backend';

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

  // Temporizador de reserva del carrito: 10 minutos desde que se agregó el primer item
  private readonly TIEMPO_EXPIRACION_MS = 10 * 60 * 1000;
  private tiempoRestante = signal<number>(this.TIEMPO_EXPIRACION_MS);
  private carritoExpirado = signal<boolean>(false);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  /**
   * Ancla del temporizador: el instante en que el carrito pasó de vacío a tener
   * su primera entrada. Se guarda aparte de los ítems y NO se recalcula a partir
   * de ellos, justamente para que el plazo no se pueda estirar.
   * Es `null` cuando el carrito está vacío.
   */
  private inicioReserva: number | null = null;
  private readonly CLAVE_INICIO_RESERVA = 'carritoInicioReserva';

  constructor(private http: HttpClient, private eventoServicio: EventoServicio) {
    this.cargarCarritoDesdeLocalStorage();
    this.iniciarTemporizador();
  }

  obtenerItems() {
    return this.itemsCarrito.asReadonly();
  }

  obtenerTiempoRestante() {
    return this.tiempoRestante.asReadonly();
  }

  obtenerCarritoExpirado() {
    return this.carritoExpirado.asReadonly();
  }

  resetearNotificacionExpiracion(): void {
    this.carritoExpirado.set(false);
  }

  /**
   * Reemplaza el contenido local del carrito (se usa al recuperarlo del backend).
   *
   * `inicioReservaBackend` es el ancla que venía guardada en el servidor. Si no
   * viene (carritos creados antes de esta versión) se reconstruye a partir de la
   * entrada más vieja, para respetar el tiempo que ya pasó en vez de regalar
   * 10 minutos nuevos.
   */
  setItemsDirect(items: ItemCarrito[], inicioReservaBackend?: string) {
    const itemsConFecha = items.map(i => ({ ...i, addedAt: i.addedAt || new Date().toISOString() }));
    this.itemsCarrito.set(itemsConFecha);

    if (itemsConFecha.length === 0) {
      this.inicioReserva = null;
    } else {
      const delBackend = inicioReservaBackend ? new Date(inicioReservaBackend).getTime() : NaN;
      this.inicioReserva = Number.isNaN(delBackend)
        ? this.deducirInicioDesdeItems(itemsConFecha)
        : delBackend;
    }

    this.guardarCarritoEnLocalStorage();
    this.verificarExpiracion();
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
      // Si es sector, incrementa la cantidad.
      // Se reemplaza el ítem por una copia en vez de modificarlo: `[...items]` copia
      // sólo el array, así que tocar `.cantidad` ahí adentro mutaría el mismo objeto
      // que ya está publicado en el signal.
      this.itemsCarrito.set(
        items.map((i, idx) =>
          idx === indiceExistente ? { ...i, cantidad: i.cantidad + item.cantidad } : i
        )
      );
    } else {
      const itemConFecha: ItemCarrito = { ...item, addedAt: item.addedAt || new Date().toISOString() };
      this.itemsCarrito.set([...items, itemConFecha]);
    }

    // El reloj arranca sólo con la PRIMERA entrada del carrito. Si ya estaba
    // corriendo se lo deja como está: agregar más entradas no estira el plazo.
    if (this.inicioReserva === null) {
      this.inicioReserva = Date.now();
    }

    this.guardarCarritoEnLocalStorage();
    this.verificarExpiracion();
  }

  eliminarDelCarrito(index: number): void {
    const items = this.itemsCarrito();
    const restantes = items.filter((_, i) => i !== index);
    this.itemsCarrito.set(restantes);

    // El ancla se borra sólo si el carrito quedó vacío (ahí el usuario ya no
    // retiene ninguna reserva). Mientras quede algo, el reloj sigue donde estaba,
    // incluso si lo que se borró era la entrada más antigua.
    if (restantes.length === 0) {
      this.inicioReserva = null;
      this.tiempoRestante.set(this.TIEMPO_EXPIRACION_MS);
    }

    this.guardarCarritoEnLocalStorage();
  }

  vaciarCarrito(): void {
    this.itemsCarrito.set([]);
    this.inicioReserva = null;
    this.guardarCarritoEnLocalStorage();
    this.tiempoRestante.set(this.TIEMPO_EXPIRACION_MS);
  }

  
  obtenerCarritos(): Observable<Carrito[]> {
    return this.http.get<Carrito[]>(this.urlBase);
  }

  obtenerCarritosPorUsuario(usuarioId: string): Observable<Carrito[]> {
    // Se filtra en el cliente (ver filtro-backend.ts): con `?usuarioId=` el backend
    // no devolvía nada para ids de dígitos, así que el carrito nunca se recuperaba
    // y cada sincronización creaba un carrito duplicado en lugar de actualizarlo.
    return this.obtenerCarritos().pipe(
      map(carritos =>
        (carritos ?? [])
          .filter(c => coincideCon(c, { usuarioId }))
          // Los usuarios que ya venían usando la app pueden tener carritos
          // duplicados por ese motivo: el más reciente va primero para que quien
          // lea el primero se quede con el vigente y no con uno viejo o vacío.
          .sort((a, b) =>
            new Date(b.fechaActualizacion ?? 0).getTime() -
            new Date(a.fechaActualizacion ?? 0).getTime()
          )
      )
    );
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
      fechaActualizacion: new Date().toISOString(),
      // Se manda el ancla para que el plazo sobreviva incluso si se borra el
      // localStorage o se entra desde otro navegador.
      ...(this.inicioReserva !== null
        ? { inicioReserva: new Date(this.inicioReserva).toISOString() }
        : {})
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
    if (butacas.length === 0) {
      return of(null);
    }

    // Se actualizan todas juntas en una sola lectura/escritura para evitar que se pisen entre sí
    return this.eventoServicio.actualizarDisponibilidadButacas(
      eventoId,
      butacas.map(b => ({ ...b, disponible: false }))
    );
  }

  // Método para desmarcar butacas (marcarlas como disponibles) cuando se sacan del carrito
  desmarcarButacas(eventoId: number|string, butacas: { fila: string; numero: number }[]): Observable<any> {
    if (butacas.length === 0) {
      return of(null);
    }

    // Se actualizan todas juntas en una sola lectura/escritura para evitar que se pisen entre sí
    return this.eventoServicio.actualizarDisponibilidadButacas(
      eventoId,
      butacas.map(b => ({ ...b, disponible: true }))
    );
  }

  /**
   * Descuenta del evento las entradas de sector que se acaban de poner en el
   * carrito, para que el stock baje en el momento y no recién al pagar.
   *
   * Es el análogo de `marcarButacasComoNoDisponibles`: mientras las entradas
   * estén en un carrito no las puede tomar nadie más, y si el carrito se vacía
   * o vence se devuelven con `liberarSectores`.
   */
  reservarSectores(eventoId: number|string, sectores: { nombre: string; cantidad: number }[]): Observable<any> {
    if (sectores.length === 0) {
      return of(null);
    }

    return this.eventoServicio.ajustarCapacidadSectores(
      eventoId,
      sectores.map(s => ({ nombre: s.nombre, delta: -s.cantidad }))
    );
  }

  /** Devuelve al evento las entradas de sector que salen del carrito. */
  liberarSectores(eventoId: number|string, sectores: { nombre: string; cantidad: number }[]): Observable<any> {
    if (sectores.length === 0) {
      return of(null);
    }

    return this.eventoServicio.ajustarCapacidadSectores(
      eventoId,
      sectores.map(s => ({ nombre: s.nombre, delta: s.cantidad }))
    );
  }

  private guardarCarritoEnLocalStorage(): void {
    localStorage.setItem('carrito', JSON.stringify(this.itemsCarrito()));

    // El ancla se guarda junto al carrito para que recargar la página no
    // reinicie el plazo: al volver, el reloj sigue donde estaba.
    if (this.inicioReserva === null) {
      localStorage.removeItem(this.CLAVE_INICIO_RESERVA);
    } else {
      localStorage.setItem(this.CLAVE_INICIO_RESERVA, String(this.inicioReserva));
    }
  }

  private cargarCarritoDesdeLocalStorage(): void {
    const carritoGuardado = localStorage.getItem('carrito');
    if (carritoGuardado) {
      try {
        const items: ItemCarrito[] = JSON.parse(carritoGuardado);
        const itemsConFecha = items.map(i => ({ ...i, addedAt: i.addedAt || new Date().toISOString() }));
        this.itemsCarrito.set(itemsConFecha);

        if (itemsConFecha.length > 0) {
          const guardado = Number(localStorage.getItem(this.CLAVE_INICIO_RESERVA));
          this.inicioReserva = Number.isFinite(guardado) && guardado > 0
            ? guardado
            : this.deducirInicioDesdeItems(itemsConFecha);
        }
      } catch (error) {
        this.itemsCarrito.set([]);
        this.inicioReserva = null;
      }
    }
  }

  private iniciarTemporizador(): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.verificarExpiracion(), 1000);
  }

  private verificarExpiracion(): void {
    const items = this.itemsCarrito();

    if (items.length === 0) {
      this.inicioReserva = null;
      this.tiempoRestante.set(this.TIEMPO_EXPIRACION_MS);
      return;
    }

    // Red de seguridad: si hay entradas pero se perdió el ancla, se reconstruye
    // desde la entrada más vieja en lugar de dar por arrancado un plazo nuevo.
    if (this.inicioReserva === null) {
      this.inicioReserva = this.deducirInicioDesdeItems(items);
      this.guardarCarritoEnLocalStorage();
    }

    const restante = this.TIEMPO_EXPIRACION_MS - (Date.now() - this.inicioReserva);

    if (restante <= 0) {
      this.expirarCarrito();
    } else {
      this.tiempoRestante.set(restante);
    }
  }

  /** Momento de la entrada más antigua; se usa sólo como respaldo del ancla. */
  private deducirInicioDesdeItems(items: ItemCarrito[]): number {
    const marcas = items
      .map(i => (i.addedAt ? new Date(i.addedAt).getTime() : NaN))
      .filter(t => !Number.isNaN(t));

    return marcas.length > 0 ? Math.min(...marcas) : Date.now();
  }

  // Vacía el carrito por vencimiento de la reserva y devuelve el stock ocupado
  private expirarCarrito(): void {
    const items = this.itemsCarrito();

    // se agrupan por evento para liberar todo lo de un mismo evento en una sola petición
    const butacasPorEvento = new Map<string, { fila: string; numero: number }[]>();
    const sectoresPorEvento = new Map<string, { nombre: string; cantidad: number }[]>();

    items.forEach(item => {
      const eventoId = String(item.evento.id);

      if (item.tipoEntrada === 'butaca') {
        const match = item.detalleEntrada.match(/Fila (\w+) - Butaca (\d+)/);
        if (match) {
          const lista = butacasPorEvento.get(eventoId) || [];
          lista.push({ fila: match[1], numero: parseInt(match[2], 10) });
          butacasPorEvento.set(eventoId, lista);
        }
      } else if (item.tipoEntrada === 'sector') {
        const lista = sectoresPorEvento.get(eventoId) || [];
        lista.push({ nombre: item.detalleEntrada, cantidad: item.cantidad });
        sectoresPorEvento.set(eventoId, lista);
      }
    });

    butacasPorEvento.forEach((butacas, eventoId) => {
      this.desmarcarButacas(eventoId, butacas).subscribe({
        // Si esto falla, las butacas quedan bloqueadas sin estar en ningún carrito,
        // así que conviene que quede rastro en la consola.
        error: err => console.error('No se pudieron liberar las butacas vencidas:', err)
      });
    });

    sectoresPorEvento.forEach((sectores, eventoId) => {
      this.liberarSectores(eventoId, sectores).subscribe({
        error: err => console.error('No se pudieron liberar las entradas vencidas:', err)
      });
    });

    this.vaciarCarrito();
    this.carritoExpirado.set(true);

    const usuarioData = localStorage.getItem('usuarioLogueado');
    if (usuarioData) {
      try {
        const usuario = JSON.parse(usuarioData);
        if (usuario?.id) {
          this.sincronizarConServidor(String(usuario.id)).subscribe();
        }
      } catch { /* ignorar */ }
    }
  }
}

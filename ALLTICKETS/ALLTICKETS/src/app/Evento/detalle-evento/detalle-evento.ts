import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EventoServicio } from '../../servicios/evento.servicio';
import { CarritoServicio } from '../../servicios/carrito.servicio';
import { Evento } from '../../modelos/evento';
import { CommonModule, DatePipe } from '@angular/common';
import { Autenticador } from '../../servicios/autenticador';
import { ModalConfirmacionService } from '../../servicios/modal-confirmacion.service';
import { AdminEventos } from '../crear-evento/admin-eventos';
import { MapaUbicacion } from '../../mapa/mapa-ubicacion/mapa-ubicacion';
import { of, Subscription, timer } from 'rxjs';
import { catchError, filter, switchMap } from 'rxjs/operators';

/** Cada cuánto se relee el evento para detectar entradas que tomó otro usuario. */
const INTERVALO_REFRESCO_MS = 2500;

/** Cuánto queda a la vista un aviso antes de esconderse solo. */
const DURACION_MENSAJE_MS = 4000;

@Component({
  selector: 'app-evento-ficha',
  imports: [DatePipe, CommonModule, AdminEventos, MapaUbicacion],
  templateUrl: './detalle-evento.html',
  styleUrls: ['./detalle-evento.css']
})
export class detalleEvento implements OnInit, OnDestroy {

  private readonly cliente = inject(EventoServicio);
  private readonly carritoServicio = inject(CarritoServicio);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly id = this.route.snapshot.paramMap.get('id');
  private readonly autenticador = inject(Autenticador);
  private readonly modalService = inject(ModalConfirmacionService);
  private pollingSubscription?: Subscription;

  protected readonly evento = signal<Evento | undefined>(undefined);
  protected readonly isEditing = signal(false);
  protected readonly usuario = signal(this.autenticador.obtenerUsuarioActual());

  protected butacasSeleccionadas = signal<{ fila: string; numero: number }[]>([]);

  /**
   * Aviso flotante. Va en signals y no en campos sueltos porque la app corre en
   * modo zoneless: al esconderse desde un temporizador, sin signal la vista no
   * se enteraría del cambio y el cartel quedaría pegado en pantalla.
   */
  protected readonly mensaje = signal<string>('');
  protected readonly tipoMensaje = signal<'error' | 'success' | ''>('');
  private ocultarMensajeId: ReturnType<typeof setTimeout> | null = null;

  /** Muestra un aviso y lo esconde solo a los pocos segundos. */
  private mostrarMensaje(texto: string, tipo: 'error' | 'success'): void {
    this.mensaje.set(texto);
    this.tipoMensaje.set(tipo);

    if (this.ocultarMensajeId) clearTimeout(this.ocultarMensajeId);
    this.ocultarMensajeId = setTimeout(() => {
      this.mensaje.set('');
      this.tipoMensaje.set('');
      this.ocultarMensajeId = null;
    }, DURACION_MENSAJE_MS);
  }

  protected butacasPorFila = computed(() => {
    const evento = this.evento();
    if (!evento?.butacas) return {};

    const agrupadas: { [fila: string]: any[] } = {};

    evento.butacas.forEach(butaca => {
      if (!agrupadas[butaca.fila]) {
        agrupadas[butaca.fila] = [];
      }
      agrupadas[butaca.fila].push(butaca);
    });

    Object.keys(agrupadas).forEach(fila => {
      agrupadas[fila].sort((a, b) => a.numero - b.numero);
    });

    return agrupadas;
  });

  protected filasOrdenadas = computed(() => {
    return Object.keys(this.butacasPorFila()).sort();
  });


  protected sectorSeleccionado = signal<string>('');
  protected cantidadSector = signal<number>(1);

  toggleEdit(){
    this.isEditing.set(!this.isEditing());
    setTimeout(() => {
    document.getElementById("form-edicion")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }, 50);
  }

  handleEdit(evento: Evento){
    this.evento.set(evento);
    this.toggleEdit();
  }

  // MÉTODOS DE BUTACAS
  seleccionarButaca(fila: string, numero: number, disponible: boolean): void {
    if (!disponible) {
      this.mostrarMensaje('⚠️ Esta butaca no está disponible', 'error');
      return;
    }

    const butacas = this.butacasSeleccionadas();
    const index = butacas.findIndex(b => b.fila === fila && b.numero === numero);

    if (index >= 0) {
      this.butacasSeleccionadas.update(lista =>
        lista.filter(b => !(b.fila === fila && b.numero === numero))
      );
    } else {
      this.butacasSeleccionadas.update(lista => [...lista, { fila, numero }]);
    }
  }

  estaSeleccionada(fila: string, numero: number): boolean {
    return this.butacasSeleccionadas().some(b => b.fila === fila && b.numero === numero);
  }

  protected totalButacas = computed(() => {
    const evento = this.evento();
    if (!evento?.butacas) return 0;

    return this.butacasSeleccionadas().reduce((total, sel) => {
      const butaca = evento.butacas.find(b => b.fila === sel.fila && b.numero === sel.numero);
      return total + (butaca?.precio || 0);
    }, 0);
  });

  limpiarSeleccion(): void {
    this.butacasSeleccionadas.set([]);
  }

  // MÉTODOS DE SECTORES
  getCapacidadDisponible(nombreSector: string): number {
    const evento = this.evento();
    const sector = evento?.sectores.find(s => s.nombre === nombreSector);
    return sector?.capacidad || 0;
  }

  seleccionarSector(nombreSector: string): void {
    this.sectorSeleccionado.set(nombreSector);
    this.cantidadSector.set(1);
  }

  aumentarCantidad(): void {
    const sector = this.evento()?.sectores.find(s => s.nombre === this.sectorSeleccionado());
    if (!sector) return;

    const disponible = this.getCapacidadDisponible(sector.nombre);
    if (this.cantidadSector() < disponible) {
        this.cantidadSector.update(c => c + 1);
    }
  }

  disminuirCantidad(): void {
    if (this.cantidadSector() > 1) {
      this.cantidadSector.update(c => c - 1);
    }
  }

  protected totalSector = computed(() => {
    const evento = this.evento();
    const sectorNombre = this.sectorSeleccionado();
    if (!evento || !sectorNombre) return 0;

    const sector = evento.sectores.find(s => s.nombre === sectorNombre);
    return (sector?.precio || 0) * this.cantidadSector();
  });

  // AGREGAR AL CARRITO
  agregarAlCarrito(): void {
    const evento = this.evento();
    if (!evento) return;

    if (!this.usuario()) {
      this.modalService.notify('Debes iniciar sesión para agregar al carrito');
      return;
    }

    if (evento.modoVenta === 'butaca') {
      this.agregarButacasAlCarrito();
    } else {
      this.agregarSectorAlCarrito();
    }
  }

  private agregarButacasAlCarrito(): void {
    const butacas = this.butacasSeleccionadas();

    const evento = this.evento()!;
    const itemsCarrito = this.carritoServicio.obtenerItems()();
    const butacasYaEnCarrito: string[] = [];
    const butacasAgregadas: string[] = [];
    const butacasParaMarcar: { fila: string; numero: number }[] = [];

    butacas.forEach(sel => {
      const butaca = evento.butacas.find(b => b.fila === sel.fila && b.numero === sel.numero);
      if (butaca) {
        const detalleButaca = `Fila ${butaca.fila} - Butaca ${butaca.numero}`;

        // Verificar si esta butaca específica ya está en el carrito
        const yaExiste = itemsCarrito.some(item =>
          item.evento.id === evento.id &&
          item.detalleEntrada === detalleButaca
        );

        if (yaExiste) {
          butacasYaEnCarrito.push(detalleButaca);
        } else {
          this.carritoServicio.agregarAlCarrito({
            evento: evento,
            cantidad: 1,
            tipoEntrada: 'butaca',
            detalleEntrada: detalleButaca,
            precioUnitario: butaca.precio
          });
          butacasAgregadas.push(detalleButaca);
          butacasParaMarcar.push(sel);
        }
      }
    });

    // Marcar butacas como no disponibles en la base de datos (todas juntas para evitar pisarse entre sí)
    if (butacasParaMarcar.length > 0) {
      this.carritoServicio.marcarButacasComoNoDisponibles(evento.id!, butacasParaMarcar).subscribe({
        next: () => {
          // Butacas marcadas exitosamente
        },
        error: (err) => {
          console.error('Error marcando butacas como no disponibles:', err);
        }
      });
    }

    if (butacasAgregadas.length > 0 && butacasYaEnCarrito.length === 0) {
      this.mostrarMensaje(`${butacasAgregadas.length} butaca(s) agregada(s) al carrito`, 'success');
    } else if (butacasAgregadas.length > 0 && butacasYaEnCarrito.length > 0) {
      this.mostrarMensaje(`${butacasAgregadas.length} butaca(s) agregada(s) al carrito. Ya tenías en el carrito: ${butacasYaEnCarrito.join(', ')}`, 'success');
    } else {
      this.mostrarMensaje(`Todas las butacas seleccionadas ya están en el carrito:\n${butacasYaEnCarrito.join('\n')}`, 'error');
    }

    this.limpiarSeleccion();

    // Sincronizar carrito con servidor si hay usuario logueado
    const usuarioLocal = this.usuario();
    if (usuarioLocal && usuarioLocal.id) {
      try {
        this.carritoServicio.sincronizarConServidor(String(usuarioLocal.id)).subscribe({
          next: () => {},
          error: (err) => { }
        });
      } catch (e) {

      }
    }
  }

  private agregarSectorAlCarrito(): void {
    const sectorNombre = this.sectorSeleccionado();

    const evento = this.evento()!;
    const sector = evento.sectores.find(s => s.nombre === sectorNombre);
    if (!sector) return;

    const cantidad = this.cantidadSector();
    const disponible = this.getCapacidadDisponible(sector.nombre);

    if (cantidad > disponible) {
      this.mostrarMensaje(`Solo hay ${disponible} entradas disponibles`, 'error');
      return;
    }

    this.carritoServicio.agregarAlCarrito({
      evento: evento,
      cantidad: cantidad,
      tipoEntrada: 'sector',
      detalleEntrada: sector.nombre,
      precioUnitario: sector.precio
    });

    // Se descuenta el stock del sector en el momento, igual que se marcan las
    // butacas como no disponibles. Sin esto la capacidad sólo bajaba al pagar,
    // así que se podían poner en el carrito (acá y desde otra sesión) más
    // entradas de las que el sector realmente tenía.
    this.carritoServicio.reservarSectores(evento.id!, [{ nombre: sector.nombre, cantidad }]).subscribe({
      error: (err) => console.error('Error reservando las entradas del sector:', err)
    });

    this.mostrarMensaje(`${cantidad} entrada(s) para ${sector.nombre} agregada(s) al carrito`, 'success');
    this.sectorSeleccionado.set('');
    this.cantidadSector.set(1);


    const usuarioLocal = this.usuario();
    if (usuarioLocal && usuarioLocal.id) {
      try {
        this.carritoServicio.sincronizarConServidor(String(usuarioLocal.id)).subscribe({
          next: () => {},
          error: (err) => { }
        });
      } catch (e) {}
    }
  }

  volverAtras(): void {
    const usuario = this.usuario();
    if (usuario?.rol === 'admin') {
      this.router.navigate(['/lista-eventos']);
    } else {
      this.router.navigate(['/menu-principal']);
    }
  }

  ngOnInit(): void {
    // `timer(0, ...)` emite de entrada, así que la carga inicial y el refresco
    // periódico son el mismo flujo: antes había además un pedido suelto que
    // duplicaba la primera lectura del evento.
    this.pollingSubscription = timer(0, INTERVALO_REFRESCO_MS)
      .pipe(
        // La primera lectura va siempre (hay que pintar la pantalla). Después se
        // saltea el refresco si la pestaña está en segundo plano (nadie lo está
        // mirando) o si el admin está editando, porque el formulario ya es dueño
        // de esos datos y refrescar por debajo no aporta nada.
        filter(tick => tick === 0 || (!document.hidden && !this.isEditing())),
        switchMap(() =>
          this.cliente.obtenerEvento(this.id!).pipe(
            catchError(() => of(null))
          )
        )
      )
      .subscribe(eventoActualizado => {
        if (eventoActualizado) {
          // Actualizar el evento
          this.evento.set(eventoActualizado);

          // Verificar si alguna butaca seleccionada se volvió no disponible
          const butacasNoDisponibles = this.butacasSeleccionadas().filter(sel => {
            const butaca = eventoActualizado.butacas.find(
              b => b.fila === sel.fila && b.numero === sel.numero
            );
            return butaca && !butaca.disponible;
          });

          // Si hay butacas que se volvieron no disponibles, removerlas de la selección
          if (butacasNoDisponibles.length > 0) {
            this.butacasSeleccionadas.update(lista =>
              lista.filter(sel =>
                !butacasNoDisponibles.some(nd => nd.fila === sel.fila && nd.numero === sel.numero)
              )
            );

            const detalles = butacasNoDisponibles
              .map(b => `Fila ${b.fila} - Butaca ${b.numero}`)
              .join('\n');

            this.mostrarMensaje(`⚠️ Las siguientes butacas seleccionadas ya no están disponibles:\n${detalles}`, 'error');
          }
        }
      });
  }

  ngOnDestroy(): void {
    // Limpiar polling al destruir el componente
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
    if (this.ocultarMensajeId) {
      clearTimeout(this.ocultarMensajeId);
    }
  }
}

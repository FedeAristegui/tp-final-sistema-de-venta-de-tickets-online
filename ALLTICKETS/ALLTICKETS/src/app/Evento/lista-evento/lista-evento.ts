import { Component, computed, inject, signal } from '@angular/core';
import { EventoServicio } from '../../servicios/evento.servicio';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Evento } from '../../modelos/evento';
import { FormsModule } from '@angular/forms';
import { ModalConfirmacionService } from '../../servicios/modal-confirmacion.service';
import { RouterLink } from '@angular/router';
import { Icono } from '../../ui/icono';

@Component({
  selector: 'app-lista-evento',
  imports: [DatePipe, FormsModule, RouterLink, Icono],
  templateUrl: './lista-evento.html',
  styleUrl: './lista-evento.css',
})
export class ListaEvento {

  private readonly client = inject(EventoServicio);
  protected readonly router = inject(Router);
  protected readonly modalService = inject(ModalConfirmacionService);

  /** Una sola lectura del listado: antes se pedía `/eventos` dos veces al entrar. */
  private readonly eventos = signal<Evento[] | undefined>(undefined);
  protected readonly isLoading = computed(() => this.eventos() === undefined);

  filtroTitulo: string = '';
  ordenActual: string | null = null;
  direccion: 'asc' | 'desc' = 'asc';

  /** Columnas ordenables. Recorrerlas evita repetir cinco `<th>` idénticos. */
  protected readonly columnas = [
    { campo: 'titulo', etiqueta: 'Título' },
    { campo: 'fecha', etiqueta: 'Fecha' },
    { campo: 'hora', etiqueta: 'Hora' },
    { campo: 'lugar', etiqueta: 'Lugar' },
    { campo: 'modoVenta', etiqueta: 'Modo de venta' },
  ];

  /** Valor de `aria-sort` que anuncian los lectores de pantalla. */
  protected estadoOrden(campo: string): 'ascending' | 'descending' | 'none' {
    if (this.ordenActual !== campo) return 'none';
    return this.direccion === 'asc' ? 'ascending' : 'descending';
  }

  constructor() {
    this.client.obtenerEventos().subscribe({
      next: eventos => this.eventos.set(eventos ?? []),
      error: () => {
        this.eventos.set([]);
        this.modalService.notify('No se pudieron cargar los eventos. Intenta nuevamente en unos minutos.');
      }
    });
  }

  ordenarPor(campo: string) {
    if (this.ordenActual === campo) {
      // Si vuelve a hacer click, invierte la dirección
      this.direccion = this.direccion === 'asc' ? 'desc' : 'asc';
    } else {
      // Si cambia de columna, arranca ascendente
      this.ordenActual = campo;
      this.direccion = 'asc';
    }
  }

  get eventosFiltrados(): Evento[] {
    const todos = this.eventos() ?? [];
    const filtro = this.filtroTitulo.trim().toLowerCase();

    // Se ordena sobre una copia: `sort` muta el array, y sin la copia terminaba
    // reordenando el mismo array que guarda el signal.
    const visibles = filtro
      ? todos.filter(ev => ev.titulo?.toLowerCase().includes(filtro))
      : [...todos];

    const campo = this.ordenActual;
    if (!campo) return visibles;

    return visibles.sort((a: any, b: any) => {
      let valorA = a[campo];
      let valorB = b[campo];

      // Si es fecha, convertir a Date
      if (campo === 'fecha') {
        valorA = new Date(valorA);
        valorB = new Date(valorB);
      }

      if (valorA < valorB) return this.direccion === 'asc' ? -1 : 1;
      if (valorA > valorB) return this.direccion === 'asc' ? 1 : -1;
      return 0;
    });
  }

  navegarAdetalles(id: number | string) {
    if (id == null) return;
    this.router.navigate(['/ficha-evento', id]);
  }

  async eliminarEvento(id: number | string) {
    if (id == null) return;

    const confirmar = await this.modalService.confirm('¿Estás seguro de eliminar este evento?');
    if (!confirmar) return;

    this.client.borrarEvento(id).subscribe({
      next: () => {
        // Antes acá había un `window.location.reload()`, que volvía a descargar el
        // bundle entero y todos los datos sólo para sacar una fila de la tabla.
        this.eventos.update(eventos =>
          (eventos ?? []).filter(ev => String(ev.id) !== String(id))
        );
      },
      error: () => {
        this.modalService.notify('Error al eliminar el evento');
      }
    });
  }
}

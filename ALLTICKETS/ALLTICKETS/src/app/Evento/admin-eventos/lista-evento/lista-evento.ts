import { Component, computed, inject } from '@angular/core';
import { EventoServicio } from '../../../servicios/evento.servicio';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Evento } from '../../../modelos/evento';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-lista-evento',
  imports: [DatePipe, RouterLink, FormsModule],
  templateUrl: './lista-evento.html',
  styleUrl: './lista-evento.css',
})
export class ListaEvento {

  private readonly client = inject(EventoServicio);
  protected readonly eventos = toSignal(this.client.obtenerEventos()) ;
  protected readonly isLoading = computed(() => this.eventos() === undefined);
  protected readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly id = this.route.snapshot.paramMap.get('id');

  protected readonly eventosOriginales = toSignal(this.client.obtenerEventos());

// propiedad para el filtro
  filtroTitulo: string = '';

  // Computed: eventos filtrados automáticamente
  get eventosFiltrados(): Evento[] {
    const todos = this.eventosOriginales() ?? [];
    if (!this.filtroTitulo) return todos;
    return todos.filter(ev =>
      ev.titulo?.toLowerCase().includes(this.filtroTitulo.toLowerCase())
    );
  }

  navegarAdetalles(id: number | string) {
    if (id == null) return;
    this.router.navigate(['/ficha-evento', id]);
  }

}

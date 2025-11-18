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

  ordenActual: string | null = null;
  direccion: 'asc' | 'desc' = 'asc';

  ordenarPor(campo: string) {
  if (this.ordenActual === campo) {
    // Si vuelve a hacer click → invertimos la dirección
    this.direccion = this.direccion === 'asc' ? 'desc' : 'asc';
  } else {
    // Si cambia de columna, arranca ascendente
    this.ordenActual = campo;
    this.direccion = 'asc';
  }

  this.eventosFiltrados.sort((a: any, b: any) => {
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
eliminarEvento(id: number | string) {
  if (id == null) return;
  

  if (!confirm('¿Estás seguro de eliminar este evento?')) {
    return; 
  }
  
 
  this.client.borrarEvento(id).subscribe({
    next: () => {
     
      
      
      
      
      window.location.reload();
      
    },
    error: (err) => {
      console.error('Error al eliminar:', err);
      alert('❌ Error al eliminar el evento');
    }
  });
}
}

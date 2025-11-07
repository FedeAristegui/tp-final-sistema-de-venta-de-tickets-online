import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule  } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormArray
} from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { EventoServicio } from '../../servicios/evento.servicio';
import { Evento } from '../../models/evento';
import { detalleEvento } from '../../detalle-evento/detalle-evento';  


@Component({
  selector: 'app-admin-eventos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-eventos.html',
  styleUrls: ['./admin-eventos.css']
})
export class AdminEventos implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly eventoService = inject(EventoServicio);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  protected eventos: Evento[] = [];
  protected modoEdicion = false;
   eventosFiltrados: Evento[] = [];
  filtroTitulo: string = '';

  protected readonly form = this.fb.group({
    id: [null as number | null],
    titulo: ['', [Validators.required, Validators.minLength(3)]],
    fecha: ['', Validators.required],
    hora: ['', Validators.required],
    lugar: ['', [Validators.required, Validators.minLength(3)]],
    imagen: ['', Validators.required],
    modoVenta: ['sector', Validators.required],
    sectores: this.fb.array([]),
    butacas: this.fb.array([])
  });


     ngOnInit(): void {
    // Load events first
    this.eventoService.obtenerEventos().subscribe({
      next: (lista: Evento[]) => {
        this.eventos = lista || [];
        this.cdr.detectChanges(); // Force view update
        
        // Then check for route param
        const idParam = this.route.snapshot.params['id'];
        if (idParam) {
          this.modoEdicion = true;
          const id = Number(idParam);
          this.eventoService.obtenerEvento(id).subscribe({
            next: ev => this.cargarEventoEnFormulario(ev),
            error: err => {
              console.error('Error al cargar evento para edición:', err);
              alert('No se pudo cargar el evento para editar.');
              this.router.navigate(['/eventos']);
            }
          });
        }
      },
      error: err => {
        console.error('Error al cargar eventos:', err);
        this.eventos = [];
        this.cdr.detectChanges(); // Force view update even on error
      }
    });
  }

  // 🔹 Getters para arrays reactivos
  get sectores(): FormArray {
    return this.form.get('sectores') as FormArray;
  }
  get butacas(): FormArray {
    return this.form.get('butacas') as FormArray;
  }

  // 🔹 Cargar lista de eventos
 cargarEventos(): void {
    this.eventoService.obtenerEventos().subscribe({
      next: lista => {
        this.eventos = lista || [];
        this.aplicarFiltro();  // aplica filtro inicial (vacío)
      },
      error: err => {
        console.error('Error al obtener eventos:', err);
        this.eventos = [];
        this.eventosFiltrados = [];
      }
    });
  }

  aplicarFiltro(): void {
    const term = this.filtroTitulo.trim().toLowerCase();
    if (!term) {
      this.eventosFiltrados = [...this.eventos];
    } else {
      this.eventosFiltrados = this.eventos.filter(ev => 
        (ev.titulo ?? '').toLowerCase().includes(term)
      );
    }
  }

  // manejar cambio de filtro ligado al input
  onFiltroCambio(): void {
    this.aplicarFiltro();
  }

  // 🔹 Cargar un evento al formulario (para edición)
  cargarEventoEnFormulario(ev: Evento): void {
    this.form.patchValue(ev);
    this.sectores.clear();
    this.butacas.clear();

    if (ev.modoVenta === 'sector' && ev.sectores) {
      ev.sectores.forEach(s =>
        this.sectores.push(
          this.fb.group({
            nombre: [s.nombre, Validators.required],
            capacidad: [s.capacidad, [Validators.required, Validators.min(1)]],
            precio: [s.precio, [Validators.required, Validators.min(0)]]
          })
        )
      );
    }

    if (ev.modoVenta === 'butaca' && ev.butacas) {
      ev.butacas.forEach(b =>
        this.butacas.push(
          this.fb.group({
            fila: [b.fila, Validators.required],
            numero: [b.numero, [Validators.required, Validators.min(1)]],
            precio: [b.precio, [Validators.required, Validators.min(0)]],
            disponible: [b.disponible]
          })
        )
      );
    }
  }

  // 🔹 Crear / Editar evento
  guardarEvento(): void {
    if (this.form.invalid) {
      alert('Por favor completá todos los campos correctamente.');
      this.form.markAllAsTouched();
      return;
    }

    // obtener valores crudos del form
    const raw = this.form.getRawValue() as any;

    // construir un Evento garantizando tipos no-nulos
    const evento: Evento = {
      id: raw.id ?? undefined,
      titulo: String(raw.titulo ?? ''),
      fecha: String(raw.fecha ?? ''),
      hora: String(raw.hora ?? ''),
      lugar: String(raw.lugar ?? ''),
      imagen: String(raw.imagen ?? ''),
      modoVenta: (raw.modoVenta as 'sector' | 'butaca') ?? 'sector',
      sectores: (raw.sectores ?? []) as Evento['sectores'],
      butacas: (raw.butacas ?? []) as Evento['butacas']
    };

     if (this.modoEdicion && evento.id != null) {
      this.eventoService.actualizarEvento(evento).subscribe({
        next: () => {
          // Update the local array immediately
          const index = this.eventos.findIndex(e => e.id === evento.id);
          if (index !== -1) {
            this.eventos[index] = { ...evento };
          }
          
          alert('✅ Evento actualizado con éxito');
          this.modoEdicion = false;
          this.form.reset({ modoVenta: 'sector' });
          this.sectores.clear();
          this.butacas.clear();
        },
        error: err => {
          console.error('Error al actualizar evento:', err);
          alert('❌ Error al actualizar el evento.');
        }
      });
    } else {
      delete (evento as any).id;
      this.eventoService.crearEvento(evento).subscribe({
        next: (nuevoEvento: Evento) => {
          // Add the new event to local array immediately
          this.eventos.push(nuevoEvento);
          
          alert('🎉 Evento creado con éxito');
          this.form.reset({ modoVenta: 'sector' });
          this.sectores.clear();
          this.butacas.clear();
        },
        error: err => {
          console.error('Error al crear evento:', err);
          alert('❌ Hubo un error al crear el evento.');
        }
      });
    }
  }


  // 🔹 Seleccionar evento de la lista
  seleccionarEvento(ev: Evento): void {
    this.modoEdicion = true;
    this.cargarEventoEnFormulario(ev);
    this.form.get('id')?.setValue(ev.id ?? null);
  }

  // 🔹 Eliminar evento
 eliminarEvento(id: number | undefined): void {
    if (!id) return;
    if (!confirm('¿Está seguro que desea eliminar este evento?')) return;

    // Remove from local array immediately (optimistic update)
    this.eventos = this.eventos.filter(e => e.id !== id);

    this.eventoService.borrarEvento(id).subscribe({
      next: () => {
        alert('🗑️ Evento eliminado');
      },
      error: err => {
        // Restore the item if deletion fails
        this.cargarEventos(); // reload the list from server
        console.error('Error al eliminar evento:', err);
        alert('❌ Error al eliminar el evento.');
      }
    });
  }

  // 🔹 Cambiar modo de venta
  cambiarModoVenta(): void {
    const modo = this.form.get('modoVenta')?.value;
    if (modo === 'sector') this.butacas.clear();
    else this.sectores.clear();
  }

  agregarSector(): void {
    this.sectores.push(
      this.fb.group({
        nombre: ['', Validators.required],
        capacidad: [0, [Validators.required, Validators.min(1)]],
        precio: [0, [Validators.required, Validators.min(0)]]
      })
    );
  }

  agregarButaca(): void {
    this.butacas.push(
      this.fb.group({
        fila: ['', Validators.required],
        numero: [0, [Validators.required, Validators.min(1)]],
        precio: [0, [Validators.required, Validators.min(0)]],
        disponible: [true]
      })
    );
  }
    navegarAdetalles(id: number | string) {
    if (id == null) return;
    this.router.navigate(['/ficha-evento', id]);
  }
}


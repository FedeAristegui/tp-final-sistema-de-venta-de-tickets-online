import { Component, inject, OnInit, signal, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { EventoServicio } from '../../../servicios/evento.servicio';
import { Evento } from '../../../modelos/evento';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-eventos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-eventos.html',
  styleUrls: ['./admin-eventos.css']
})
export class AdminEventos implements OnInit {

  @Input() isEditing: boolean = false;
  @Input() evento?: Evento;
  @Output() edited = new EventEmitter<Evento>();

  private readonly fb = inject(FormBuilder);
  private readonly eventoService = inject(EventoServicio);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected eventos = signal<Evento[]>([]);
  protected modoEdicion = signal(false);
  protected mostrarTodasButacas = signal(false);

  toggleMostrarTodas(): void {
    this.mostrarTodasButacas.update(v => !v);
  }

  protected readonly form = this.fb.group({
    id: [null as number | null],
    titulo: ['', [Validators.required, Validators.minLength(3)]],
    fecha: ['', Validators.required],
    hora: ['', Validators.required],
    lugar: ['', [Validators.required, Validators.minLength(3)]],
    imagen: ['', Validators.required],
    modoVenta: ['sector' as 'sector' | 'butaca', Validators.required],
    sectores: this.fb.array([]),
    butacas: this.fb.array([])
  });

  // 🔹 Formulario generador de butacas
  protected readonly generadorButacas = this.fb.group({
    filas: ['', Validators.required],
    butacasPorFila: [0, [Validators.required, Validators.min(1)]],
    precioBase: [0, [Validators.required, Validators.min(0)]]
  });

  get sectores(): FormArray {
    return this.form.get('sectores') as FormArray;
  }

  get butacas(): FormArray {
    return this.form.get('butacas') as FormArray;
  }

  ngOnInit(): void {
    this.cargarEventos();

    // Si viene desde @Input, usar ese evento
    if (this.isEditing && this.evento) {
      this.modoEdicion.set(true);
      this.cargarEventoEnFormulario(this.evento);
      return;
    }

    // Si viene desde ruta, cargar por ID
    const idParam = this.route.snapshot.params['id'];
    if (idParam) {
      this.modoEdicion.set(true);
      const id = Number(idParam);
      this.eventoService.obtenerEvento(id).subscribe({
        next: ev => this.cargarEventoEnFormulario(ev),
        error: err => {
          console.error('Error al cargar evento:', err);
          alert('No se pudo cargar el evento para editar.');
          this.router.navigate(['/eventos']);
        }
      });
    }
  }

  cargarEventos(): void {
    this.eventoService.obtenerEventos().subscribe({
      next: (lista: Evento[]) => {
        this.eventos.set(lista || []);
      },
      error: err => {
        console.error('Error al cargar eventos:', err);
        this.eventos.set([]);
      }
    });
  }

  cargarEventoEnFormulario(ev: Evento): void {
    if (!ev) return;

    this.form.patchValue({
      id: ev.id,
      titulo: ev.titulo,
      fecha: ev.fecha,
      hora: ev.hora,
      lugar: ev.lugar,
      imagen: ev.imagen,
      modoVenta: ev.modoVenta
    });

    this.sectores.clear();
    this.butacas.clear();

    if (ev.modoVenta === 'sector' && ev.sectores?.length) {
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

    if (ev.modoVenta === 'butaca' && ev.butacas?.length) {
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

  seleccionarEvento(ev: Evento): void {
    this.modoEdicion.set(true);
    this.cargarEventoEnFormulario(ev);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  eliminarSector(index: number): void {
    if (confirm('¿Eliminar este sector?')) {
      this.sectores.removeAt(index);
    }
  }

  agregarButaca(): void {
    const ultimaButaca = this.butacas.length > 0 ? this.butacas.at(this.butacas.length - 1).value : null;
    const filaDefault = ultimaButaca?.fila || 'A';
    const numeroDefault = ultimaButaca ? (ultimaButaca.numero + 1) : 1;
    const precioDefault = ultimaButaca?.precio || 0;

    this.butacas.push(
      this.fb.group({
        fila: [filaDefault, Validators.required],
        numero: [numeroDefault, [Validators.required, Validators.min(1)]],
        precio: [precioDefault, [Validators.required, Validators.min(0)]],
        disponible: [true]
      })
    );
  }

  eliminarButaca(index: number): void {
    if (confirm('¿Eliminar esta butaca?')) {
      this.butacas.removeAt(index);
    }
  }

  limpiarButacas(): void {
    if (confirm(`¿Eliminar todas las ${this.butacas.length} butacas?`)) {
      while (this.butacas.length) {
        this.butacas.removeAt(0);
      }
      this.mostrarTodasButacas.set(false);
    }
  }

  // 🔹 Generar butacas automáticamente
  generarButacas(): void {
    const filasInput = this.generadorButacas.get('filas')?.value || '';
    const cantidad = this.generadorButacas.get('butacasPorFila')?.value || 0;
    const precio = this.generadorButacas.get('precioBase')?.value || 0;

    if (!filasInput.trim()) {
      alert('⚠️ Por favor ingresa las filas (Ejemplo: A-E o A,B,C)');
      return;
    }

    if (cantidad <= 0) {
      alert('⚠️ La cantidad de butacas por fila debe ser mayor a 0');
      return;
    }

    if (precio < 0) {
      alert('⚠️ El precio debe ser mayor o igual a 0');
      return;
    }

    const filas = this.parsearFilas(filasInput);
    
    if (filas.length === 0) {
      alert('❌ Formato de filas inválido.\n\nEjemplos válidos:\n• A,B,C (filas separadas por coma)\n• A-E (rango de filas)');
      return;
    }

    const totalButacas = filas.length * cantidad;
    const mensaje = this.butacas.length > 0
      ? `¿Generar ${totalButacas} butacas nuevas?\n\n📊 Configuración:\n• ${filas.length} filas (${filas.join(', ')})\n• ${cantidad} butacas por fila\n• $${precio} por butaca\n\n⚠️ Esto reemplazará las ${this.butacas.length} butacas actuales`
      : `¿Generar ${totalButacas} butacas?\n\n📊 Configuración:\n• ${filas.length} filas (${filas.join(', ')})\n• ${cantidad} butacas por fila\n• $${precio} por butaca`;

    if (!confirm(mensaje)) {
      return;
    }

    // Limpiar butacas existentes
    while (this.butacas.length) {
      this.butacas.removeAt(0);
    }

    // Generar nuevas butacas
    filas.forEach(fila => {
      for (let num = 1; num <= cantidad; num++) {
        this.butacas.push(
          this.fb.group({
            fila: [fila, Validators.required],
            numero: [num, [Validators.required, Validators.min(1)]],
            precio: [precio, [Validators.required, Validators.min(0)]],
            disponible: [true]
          })
        );
      }
    });

    this.mostrarTodasButacas.set(false);
    alert(`✅ ${totalButacas} butacas generadas correctamente\n\nFilas: ${filas.join(', ')}\nButacas por fila: ${cantidad}`);
  }

  private parsearFilas(input: string): string[] {
    const trimmed = input.trim().toUpperCase();

    if (trimmed.includes('-')) {
      const partes = trimmed.split('-');
      if (partes.length !== 2) return [];
      
      const inicio = partes[0].trim().charCodeAt(0);
      const fin = partes[1].trim().charCodeAt(0);
      
      if (inicio > fin || inicio < 65 || fin > 90) return [];
      
      const filas: string[] = [];
      for (let i = inicio; i <= fin; i++) {
        filas.push(String.fromCharCode(i));
      }
      return filas;
    }

    return trimmed.split(',').map(f => f.trim()).filter(f => f.length > 0);
  }

  cambiarModoVenta(): void {
    const modo = this.form.get('modoVenta')?.value;
    if (modo === 'sector') {
      while (this.butacas.length) {
        this.butacas.removeAt(0);
      }
      this.generadorButacas.reset();
    } else {
      while (this.sectores.length) {
        this.sectores.removeAt(0);
      }
    }
  }

  // Método para manejar el submit del formulario
  handleSubmit(): void {
    this.guardarEvento();
  }

  // Método para cancelar la edición
  cancelarEdicion(): void {
    this.modoEdicion.set(false);
    this.form.reset({ modoVenta: 'sector' });
    while (this.sectores.length) {
      this.sectores.removeAt(0);
    }
    while (this.butacas.length) {
      this.butacas.removeAt(0);
    }
    this.generadorButacas.reset();
  }

  guardarEvento(): void {
    if (this.form.invalid) {
      alert('Por favor completá todos los campos correctamente.');
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue() as any;

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

    if (this.modoEdicion() && evento.id != null) {
      this.eventoService.actualizarEvento(evento, evento.id).subscribe({
        next: () => {
          this.eventos.update(eventos => {
            const index = eventos.findIndex(e => e.id === evento.id);
            if (index !== -1) {
              const updated = [...eventos];
              updated[index] = { ...evento };
              return updated;
            }
            return eventos;
          });
          alert('✅ Evento actualizado con éxito');
          
          // Si viene desde @Input, emitir el evento actualizado
          if (this.isEditing) {
            this.edited.emit(evento);
          }
          
          this.cancelarEdicion();
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
          this.eventos.update(eventos => [...eventos, nuevoEvento]);
          alert('🎉 Evento creado con éxito');
          this.cancelarEdicion();
        },
        error: err => {
          console.error('Error al crear evento:', err);
          alert('❌ Hubo un error al crear el evento.');
        }
      });
    }
  }

  eliminarEvento(id: number | undefined): void {
    if (!id) return;
    if (!confirm('¿Está seguro que desea eliminar este evento?')) return;

    this.eventos.update(eventos => eventos.filter(e => e.id !== id));

    this.eventoService.borrarEvento(id).subscribe({
      next: () => {
        alert('🗑️ Evento eliminado');
      },
      error: err => {
        this.cargarEventos();
        console.error('Error al eliminar evento:', err);
        alert('❌ Error al eliminar el evento.');
      }
    });
  }

  navegarAdetalles(id: number | undefined): void {
    if (id != null) {
      this.router.navigate(['/ficha-evento', id]);
    }
  }
}
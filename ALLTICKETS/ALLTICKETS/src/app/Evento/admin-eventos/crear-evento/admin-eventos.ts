import { Component, effect, inject, input, output } from '@angular/core';
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
export class AdminEventos {

  private readonly fb = inject(FormBuilder);
  private readonly eventoService = inject(EventoServicio);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Props estilo "MovieForm"
  readonly isEditing = input(false);
  readonly evento = input<Evento>();
  readonly edited = output<Evento>();

  protected readonly form = this.fb.nonNullable.group({
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

  // Getters para arrays reactivos
  get sectores(): FormArray {
    return this.form.get('sectores') as FormArray;
  }
  get butacas(): FormArray {
    return this.form.get('butacas') as FormArray;
  }

  constructor() {
    // Efecto: si es edición y llega un evento, parcheamos el form
    effect(() => {
      if (this.isEditing() && this.evento()) {
        this.cargarEventoEnFormulario(this.evento()!);
      }
    });
  }

  // 🔹 Cargar un evento en el formulario
  cargarEventoEnFormulario(ev: Evento) {
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

  // 🔹 Agregar items dinámicos
  agregarSector() {
    this.sectores.push(
      this.fb.group({
        nombre: ['', Validators.required],
        capacidad: [0, [Validators.required, Validators.min(1)]],
        precio: [0, [Validators.required, Validators.min(0)]]
      })
    );
  }

  agregarButaca() {
    this.butacas.push(
      this.fb.group({
        fila: ['', Validators.required],
        numero: [0, [Validators.required, Validators.min(1)]],
        precio: [0, [Validators.required, Validators.min(0)]],
        disponible: [true]
      })
    );
  }

  cambiarModoVenta() {
    const modo = this.form.get('modoVenta')?.value;
    if (modo === 'sector') this.butacas.clear();
    else this.sectores.clear();
  }

  // 🔹 Guardar evento (crear o actualizar)
  handleSubmit() {
    if (this.form.invalid) {
      alert('El formulario es inválido');
      return;
    }

    if (!confirm('Desea confirmar los datos')) return;

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

    if (this.isEditing() && evento.id != null) {
      this.eventoService.actualizarEvento(evento, evento.id).subscribe({
        next: () => {
          alert('✅ Evento actualizado con éxito');
          this.edited.emit(evento);
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
          alert('🎉 Evento creado con éxito');
          this.edited.emit(nuevoEvento);
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
}

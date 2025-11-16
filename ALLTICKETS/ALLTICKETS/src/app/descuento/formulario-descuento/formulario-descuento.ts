import { Component, effect, EventEmitter, inject, input, Output, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClienteDescuento } from '../cliente-descuento';
import { Descuento } from '../../modelos/descuento';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-formulario-descuento',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './formulario-descuento.html',
  styleUrl: './formulario-descuento.css',
})
export class FormularioDescuento {
  // 🔹 Inyecciones
  private readonly formBuilder = inject(FormBuilder);
  private readonly descuentoClient = inject(ClienteDescuento);
  @Output() cancelled = new EventEmitter<void>();


  // 🔹 Inputs y Outputs
  readonly isEditing = input(false);
  readonly descuento = input<Descuento>();
  readonly edited = output<Descuento>();

  constructor() {
    // Si estamos editando, precarga los datos en el formulario
    effect(() => {
      if (this.isEditing() && this.descuento()) {
        this.form.patchValue(this.descuento()!);
      }
    });
  }

  // 🔹 Definición del formulario reactivo
  protected readonly form = this.formBuilder.nonNullable.group({
    codigo: ['', Validators.required],
    porcentaje: [0, [Validators.required, Validators.min(1), Validators.max(100)]],
    fechaInicio: ['', Validators.required],
    fechaFin: ['', Validators.required],
    activo: [true]
  });

  // 🔹 Getters de conveniencia
  get codigo() { return this.form.controls.codigo; }
  get porcentaje() { return this.form.controls.porcentaje; }
  get fechaInicio() { return this.form.controls.fechaInicio; }
  get fechaFin() { return this.form.controls.fechaFin; }

  // 🔹 Manejo del envío del formulario
  handleSubmit() {
    if (this.form.invalid) {
      alert('Por favor completá todos los campos correctamente.');
      return;
    }

    if (confirm('¿Desea confirmar los datos del descuento?')) {
      const descuento = this.form.getRawValue();

      if (!this.isEditing()) {
        // Crear nuevo descuento
        this.descuentoClient.agregarDescuento(descuento).subscribe(() => {
          alert('🎉 Descuento creado con éxito');
          this.form.reset({ activo: true });
        });
      } else if (this.descuento()) {
        // Actualizar descuento existente
        this.descuentoClient.actualizarDescuento(descuento, this.descuento()?.id!).subscribe((d) => {
          alert('✅ Descuento modificado con éxito');
          this.edited.emit(d);
        });
      }
    }
  }

  cancelarEdicion(): void {
    this.cancelled.emit();
  }

}

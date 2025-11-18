import { Component, effect, EventEmitter, inject, input, Output, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ClienteDescuento } from '../cliente-descuento';
import { Descuento } from '../../modelos/descuento';
import { Router, RouterLink } from '@angular/router';

// Validador: fecha inicio no puede ser pasada (sí permite hoy)
export const minDateTodayValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (!control.value) return null;
  
  const [year, month, day] = control.value.split('-').map(Number);
  const selectedDate = new Date(year, month - 1, day);
  
  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  return selectedDate < todayDate ? { minDateToday: true } : null;
};

// Validador: fecha fin debe ser al menos 1 día mayor que fecha inicio
export const dateFinValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const fechaInicio = group.get('fechaInicio')?.value;
  const fechaFin = group.get('fechaFin')?.value;

  if (!fechaInicio || !fechaFin) return null;

  const [initYear, initMonth, initDay] = fechaInicio.split('-').map(Number);
  const inicio = new Date(initYear, initMonth - 1, initDay);

  const [finYear, finMonth, finDay] = fechaFin.split('-').map(Number);
  const fin = new Date(finYear, finMonth - 1, finDay);

  // Fin debe ser al menos 1 día después del inicio
  const unDiaDesp = new Date(inicio);
  unDiaDesp.setDate(unDiaDesp.getDate() + 1);

  return fin < unDiaDesp ? { dateFinInvalid: true } : null;
};

@Component({
  selector: 'app-formulario-descuento',
  imports: [ReactiveFormsModule],
  templateUrl: './formulario-descuento.html',
  styleUrl: './formulario-descuento.css',
})
export class FormularioDescuento {
  // 🔹 Inyecciones
  private readonly formBuilder = inject(FormBuilder);
  private readonly descuentoClient = inject(ClienteDescuento);
  @Output() cancelled = new EventEmitter<void>();
  protected readonly router = inject(Router);


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
    fechaInicio: ['', [Validators.required, minDateTodayValidator]],
    fechaFin: ['', Validators.required],
    activo: [true]
  }, { validators: [dateFinValidator] });

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
          this.router.navigateByUrl('/lista-descuento');
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

import { Component, effect, EventEmitter, inject, input, Output, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ClienteDescuento } from '../../servicios/cliente-descuento';
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
  
  private readonly formBuilder = inject(FormBuilder);
  private readonly descuentoClient = inject(ClienteDescuento);
  @Output() cancelled = new EventEmitter<void>();
  protected readonly router = inject(Router);


  
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

  
  protected readonly form = this.formBuilder.nonNullable.group({
    codigo: ['', Validators.required],
    porcentaje: [0, [Validators.required, Validators.min(1), Validators.max(100)]],
    fechaInicio: ['', [Validators.required, minDateTodayValidator]],
    fechaFin: ['', Validators.required],
    activo: [true]
  }, { validators: [dateFinValidator] });

  
  get codigo() { return this.form.controls.codigo; }
  get porcentaje() { return this.form.controls.porcentaje; }
  get fechaInicio() { return this.form.controls.fechaInicio; }
  get fechaFin() { return this.form.controls.fechaFin; }

  mensaje: string = '';
  tipoMensaje: 'error' | 'success' | '' = '';

  // Modal de confirmación
  showConfirmModal: boolean = false;
  private pendingDescuento: Descuento | null = null;

  handleSubmit() {
    if (this.form.invalid) {
      this.mensaje = 'Por favor completá todos los campos correctamente.';
      this.tipoMensaje = 'error';
      return;
    }
    // Guardamos datos en pending y mostramos el modal de confirmación
    this.pendingDescuento = this.form.getRawValue();
    this.showConfirmModal = true;
  }

  // Confirma guardado desde el modal
  confirmSave(): void {
    if (!this.pendingDescuento) return;

    const descuento = this.pendingDescuento;

    if (!this.isEditing()) {
      this.descuentoClient.agregarDescuento(descuento).subscribe(() => {
        this.mensaje = 'Descuento agregado con éxito';
        this.tipoMensaje = 'success';
        this.form.reset({ activo: true });
        this.closeConfirmModal();
      });
    } else if (this.descuento()) {
      this.descuentoClient.actualizarDescuento(descuento, this.descuento()?.id!).subscribe((d) => {
        this.mensaje = 'Descuento modificado con éxito';
        this.tipoMensaje = 'success';
        this.edited.emit(d);
        this.closeConfirmModal();
      });
    }
  }

  // Cancela el modal
  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.pendingDescuento = null;
  }

  cancelarEdicion(): void {
    this.cancelled.emit();
  }

}

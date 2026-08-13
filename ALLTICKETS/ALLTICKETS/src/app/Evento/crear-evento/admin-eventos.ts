import { Component, inject, OnInit, signal, Input, Output, EventEmitter} from '@angular/core';
import { FormBuilder, FormArray, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Validador: rechaza números en texto (para título y lugar)
export const noNumbersValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (!control.value) return null;
  const hasNumbers = /\d/.test(control.value);
  return hasNumbers ? { hasNumbers: true } : null;
};

// Validador: rechaza fechas pasadas o de hoy (solo futuro)
export const minDateValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (!control.value) return null;
  const selectedDate = new Date(control.value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selectedDate <= today ? { minDate: true } : null;
};

// Validador: imagen debe ser una URL HTTPS o una ruta local (base64 o archivo)
export const imageValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (!control.value) return null;
  // Aceptar URLs HTTPS, rutas locales con assets/, o data URLs (base64)
  const value = control.value;
  const isHttpsUrl = value.startsWith('https://');
  const isLocalPath = value.startsWith('assets/');
  const isDataUrl = value.startsWith('data:image/');
  return (isHttpsUrl || isLocalPath || isDataUrl) ? null : { invalidImage: true };
};

// Validador: solo letras (para nombre de sectores)
export const onlyLettersValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (!control.value) return null;
  const onlyLetters = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(control.value);
  return onlyLetters ? null : { onlyLetters: true };
};

// Validador: número positivo (mayor que 0)
export const positiveNumberValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (control.value === null || control.value === undefined || control.value === '') return null;
  const num = Number(control.value);
  return !isNaN(num) && num > 0 ? null : { positiveNumber: true };
};

// Validador: filas válidas (formato A-E o A,B,C - no se permite AHADJ)
export const validFilasValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (!control.value) return null;
  const trimmed = String(control.value).trim().toUpperCase();

  // Validar formato de rango A-E (no puede haber más de una letra sin guión)
  if (trimmed.includes('-')) {
    const partes = trimmed.split('-');
    if (partes.length !== 2) return { invalidFilas: true };
    
    const inicio = partes[0].trim();
    const fin = partes[1].trim();
    
    // Cada parte debe ser exactamente una letra
    if (inicio.length !== 1 || fin.length !== 1) return { invalidFilas: true };
    
    const inicioCode = inicio.charCodeAt(0);
    const finCode = fin.charCodeAt(0);
    
    if (inicioCode < 65 || inicioCode > 90 || finCode < 65 || finCode > 90 || inicioCode > finCode) {
      return { invalidFilas: true };
    }
    return null;
  }

  // Validar formato de lista A,B,C (cada elemento debe ser exactamente una letra)
  const filas = trimmed.split(',').map(f => f.trim()).filter(f => f.length > 0);
  if (filas.length === 0) return { invalidFilas: true };

  for (const fila of filas) {
    // Rechaza si hay más de una letra
    if (fila.length !== 1) return { invalidFilas: true };
    const code = fila.charCodeAt(0);
    if (code < 65 || code > 90) return { invalidFilas: true };
  }

  return null;
};

// Validador: exige al menos un sector o una butaca según el modo de venta
export const requireSectorOrButacaByModo: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const modo = group.get('modoVenta')?.value;
  const sectores = group.get('sectores') as FormArray | null;
  const butacas  = group.get('butacas')  as FormArray | null;

  const sectoresCount = sectores ? sectores.length : 0;
  const butacasCount  = butacas ? butacas.length : 0;

  if (modo === 'sector') {
    return sectoresCount > 0 ? null : { requireSectorOrButaca: true };
  }
  if (modo === 'butaca') {
    return butacasCount > 0 ? null : { requireSectorOrButaca: true };
  }

  return (sectoresCount === 0 && butacasCount === 0) ? { requireSectorOrButaca: true } : null;
};
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { EventoServicio } from '../../servicios/evento.servicio';
import { ModalConfirmacionService } from '../../servicios/modal-confirmacion.service';
import { Evento, Ubicacion } from '../../modelos/evento';
import { CommonModule } from '@angular/common';
import { SelectorUbicacion } from '../../mapa/selector-ubicacion/selector-ubicacion';

@Component({
  selector: 'app-admin-eventos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SelectorUbicacion],
  templateUrl: './admin-eventos.html',
  styleUrls: ['./admin-eventos.css']
})
export class AdminEventos implements OnInit {

  @Input() isEditing: boolean = false;
  @Input() evento?: Evento;
  @Output() edited = new EventEmitter<Evento>();

  private readonly fb = inject(FormBuilder);
  private readonly eventoService = inject(EventoServicio);
  private readonly modalService = inject(ModalConfirmacionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected eventos = signal<Evento[]>([]);
  protected modoEdicion = signal(false);
  protected mostrarTodasButacas = signal(false);
  protected archivoSeleccionado = signal<string>('');
  
  // modal de confirmación
  protected showConfirmModal = signal<boolean>(false);
  protected confirmMessage = signal<string>('');
  protected pendingAction: 'eliminarSector' | 'eliminarButaca' | 'limpiarButacas' | 'generarButacas' | 'eliminarEvento' | null = null;
  protected pendingData: any = null;
  
  @Output() cancelled = new EventEmitter<void>();

  mensaje: string = '';
  tipoMensaje: 'error' | 'success' | '' = '';

  toggleMostrarTodas(): void {
    this.mostrarTodasButacas.update(v => !v);
  }

  // Manejar selección de archivo de imagen
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      // Validar que sea un archivo PNG
      if (!file.type.match('image/png')) {
        this.mensaje = '⚠️ Solo se aceptan archivos PNG';
        this.tipoMensaje = 'error';
        input.value = '';
        this.archivoSeleccionado.set('');
        this.form.get('imagen')?.setValue('');
        return;
      }

      // Validar tamaño máximo (5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        this.mensaje = '⚠️ El archivo es demasiado grande. Máximo 5MB';
        this.tipoMensaje = 'error';
        input.value = '';
        this.archivoSeleccionado.set('');
        this.form.get('imagen')?.setValue('');
        return;
      }

      // Leer el archivo como base64
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const base64String = e.target?.result as string;
        
        // Guardar el base64 en el formulario
        this.form.get('imagen')?.setValue(base64String);
        this.archivoSeleccionado.set(file.name);
      };
      reader.readAsDataURL(file);
    }
  }

  protected readonly form = this.fb.group({
    id: [null as number | null],
    titulo: ['', [Validators.required, Validators.minLength(3)]],
    fecha: ['', [Validators.required, minDateValidator]],
    hora: ['', Validators.required],
    lugar: ['', [Validators.required, Validators.minLength(3), noNumbersValidator]],
    // Opcional a propósito: los eventos ya cargados no tienen ubicación y deben
    // poder seguir editándose sin obligar al admin a marcarles el punto en el mapa.
    ubicacion: [null as Ubicacion | null],
    imagen: ['', [Validators.required, imageValidator]],
    modoVenta: ['sector' as 'sector' | 'butaca', Validators.required],
    categoria: ['', Validators.required],
    sectores: this.fb.array([]),
    butacas: this.fb.array([])
  }, { validators: [requireSectorOrButacaByModo] });

  protected readonly categorias = [
    'Deportes', 'Música', 'Comedia','Teatro'
  ];

   
  //  Formulario generador de butacas
  protected readonly generadorButacas = this.fb.group({
    filas: ['', [Validators.required, validFilasValidator]],
    butacasPorFila: [0, [Validators.required, positiveNumberValidator, Validators.max(30)]],
    precioBase: [0, [Validators.required, positiveNumberValidator]]
  });

  get titulo(){
    return this.form.controls.titulo;
  }
  get fecha(){
    return this.form.controls.fecha;
  }
  get hora(){
    return this.form.controls.hora;
  }
  get lugar(){
    return this.form.controls.lugar;
  }

  get ubicacion(){
    return this.form.controls.ubicacion;
  }

  /**
   * Espejo en signal del control 'ubicacion'. La app corre en modo zoneless, así que
   * leer el valor del control directamente desde el template no garantiza refresco;
   * el signal sí lo garantiza.
   */
  protected readonly ubicacionActual = signal<Ubicacion | null>(null);

  /** Recibe el punto elegido en el mapa y lo guarda en el formulario. */
  protected onUbicacionCambiada(ubicacion: Ubicacion | null): void {
    this.ubicacion.setValue(ubicacion);
    this.ubicacionActual.set(ubicacion);
    // Marcamos el form como sucio para que el guard de "salir sin guardar"
    // también proteja los cambios hechos sólo sobre el mapa.
    this.ubicacion.markAsDirty();
  }

  get imagen(){
    return this.form.controls.imagen;
  }

  get modoVenta(){
    return this.form.controls.modoVenta;
  }

  get categoria(){  
    return this.form.controls.categoria;
  }

  get sectores(){
    return this.form.controls.sectores as FormArray;
  }

  get butacas(){
    return this.form.controls.butacas as FormArray;
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
        error: async err => {
          await this.modalService.notify('No se pudo cargar el evento para editar.');
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
      ubicacion: ev.ubicacion ?? null,
      categoria: ev.categoria,
      imagen: ev.imagen,
      modoVenta: ev.modoVenta
    });
    this.ubicacionActual.set(ev.ubicacion ?? null);

    this.sectores.clear();
    this.butacas.clear();

    if (ev.modoVenta === 'sector' && ev.sectores?.length) {
      ev.sectores.forEach(s =>
        this.sectores.push(
          this.fb.group({
            nombre: [s.nombre, [Validators.required, onlyLettersValidator]],
            capacidad: [s.capacidad, [Validators.required, positiveNumberValidator]],
            precio: [s.precio, [Validators.required, positiveNumberValidator]]
          })
        )
      );
    }

    if (ev.modoVenta === 'butaca' && ev.butacas?.length) {
      ev.butacas.forEach(b =>
        this.butacas.push(
          this.fb.group({
            fila: [b.fila, [Validators.required, onlyLettersValidator]],
            numero: [b.numero, [Validators.required, positiveNumberValidator]],
            precio: [b.precio, [Validators.required, positiveNumberValidator]],
            disponible: [b.disponible]
          })
        )
      );
    }
    // Forzar revalidación después de llenar el formulario
    this.form.updateValueAndValidity();
  }

  seleccionarEvento(ev: Evento): void {
    this.modoEdicion.set(true);
    this.cargarEventoEnFormulario(ev);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  agregarSector(): void {
    this.sectores.push(
      this.fb.group({
        nombre: ['', [Validators.required, onlyLettersValidator]],
        capacidad: [0, [Validators.required, positiveNumberValidator]],
        precio: [0, [Validators.required, positiveNumberValidator]]
      })
    );
    this.form.updateValueAndValidity();
  }

  eliminarSector(index: number): void {
    this.pendingAction = 'eliminarSector';
    this.pendingData = index;
    this.confirmMessage.set('¿Eliminar este sector?');
    this.showConfirmModal.set(true);
  }

  private confirmarEliminarSector() {
    if (this.pendingData === null) return;
    this.sectores.removeAt(this.pendingData);
    this.form.updateValueAndValidity();
    this.closeConfirmModal();
  }

  agregarButaca(): void {
    const ultimaButaca = this.butacas.length > 0 ? this.butacas.at(this.butacas.length - 1).value : null;
    
    let filaDefault = 'A';
    let numeroDefault = 1;
    
    if (ultimaButaca?.fila) {
      const filaActual = ultimaButaca.fila;
      const numeroActual = ultimaButaca.numero || 0;
      
      // Si el número actual es menor que 10, continuar en la misma fila
      if (numeroActual < 10) {
        filaDefault = filaActual;
        numeroDefault = numeroActual + 1;
      } else {
        // Si ya hay 10 butacas, cambiar a la siguiente fila
        const codigoFila = filaActual.charCodeAt(0);
        filaDefault = String.fromCharCode(codigoFila + 1);
        numeroDefault = 1;
      }
    }
    
    const precioDefault = ultimaButaca?.precio || 0;

    this.butacas.push(
      this.fb.group({
        fila: [filaDefault, [Validators.required, onlyLettersValidator]],
        numero: [numeroDefault, [Validators.required, positiveNumberValidator,Validators.max(30)]],
        precio: [precioDefault, [Validators.required, positiveNumberValidator]],
        disponible: [true]
      })
    );
    this.form.updateValueAndValidity();
  }

  eliminarButaca(index: number): void {
    this.pendingAction = 'eliminarButaca';
    this.pendingData = index;
    this.confirmMessage.set('¿Eliminar esta butaca?');
    this.showConfirmModal.set(true);
  }

  private confirmarEliminarButaca() {
    if (this.pendingData === null) return;
    this.butacas.removeAt(this.pendingData);
    this.form.updateValueAndValidity();
    this.closeConfirmModal();
  }

  limpiarButacas(): void {
    this.pendingAction = 'limpiarButacas';
    this.confirmMessage.set(`¿Eliminar todas las ${this.butacas.length} butacas?`);
    this.showConfirmModal.set(true);
  }

  private confirmarLimpiarButacas() {
    while (this.butacas.length) {
      this.butacas.removeAt(0);
    }
    this.mostrarTodasButacas.set(false);
    this.form.updateValueAndValidity();
    this.closeConfirmModal();
  }

  //  Generar butacas automáticamente
  generarButacas(){
    if (this.generadorButacas.invalid) {
      const cantidadControl = this.generadorButacas.get('butacasPorFila');
      
      this.generadorButacas.markAllAsTouched();
      return;
    }

    const filasInput = this.generadorButacas.get('filas')?.value || '';
    const cantidad = this.generadorButacas.get('butacasPorFila')?.value || 0;
    const precio = this.generadorButacas.get('precioBase')?.value || 0;

    const filas = this.parsearFilas(filasInput);
    
    if (filas.length === 0) {
      this.mensaje = '⚠️ Formato de filas inválido. Ejemplo: A-E o A,B,C';
      this.tipoMensaje = 'error';
      return;
    }

    const totalButacas = filas.length * cantidad;
    const mensajeConfirm = this.butacas.length > 0
      ? `¿Generar ${totalButacas} butacas nuevas?\n\n📊 Configuración:\n• ${filas.length} filas (${filas.join(', ')})\n• ${cantidad} butacas por fila\n• $${precio} por butaca\n\n⚠️ Esto reemplazará las ${this.butacas.length} butacas actuales`
      : `¿Generar ${totalButacas} butacas?\n\n📊 Configuración:\n• ${filas.length} filas (${filas.join(', ')})\n• ${cantidad} butacas por fila\n• $${precio} por butaca`;

    this.pendingAction = 'generarButacas';
    this.pendingData = { filas, cantidad, precio, totalButacas };
    this.confirmMessage.set(mensajeConfirm);
    this.showConfirmModal.set(true);
  }

  private confirmarGenerarButacas() {
    if (!this.pendingData) return;
    
    const { filas, cantidad, precio, totalButacas } = this.pendingData;

    // Limpiar butacas existentes
    while (this.butacas.length) {
      this.butacas.removeAt(0);
    }

    // Generar nuevas butacas
    filas.forEach((fila: string) => {
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
    this.mensaje = `${totalButacas} butacas generadas correctamente\n\nFilas: ${filas.join(', ')}\nButacas por fila: ${cantidad}`;
    this.tipoMensaje = 'success';
    this.closeConfirmModal();
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
    this.form.updateValueAndValidity();
  }

  handleSubmit(): void {
    this.guardarEvento();
  }

  cancelarEdicion(): void {
    this.modoEdicion.set(false);
    this.form.reset({ modoVenta: 'sector' });
    this.ubicacionActual.set(null);
    while (this.sectores.length) {
      this.sectores.removeAt(0);
    }
    while (this.butacas.length) {
      this.butacas.removeAt(0);
    }
    this.generadorButacas.reset();
    this.cancelled.emit();
  }

  guardarEvento(): void {
    if (this.form.invalid) {
      if (this.form.hasError('requireSectorOrButaca')) {
        const modo = this.form.get('modoVenta')?.value;
        if (modo === 'sector') {
          this.mensaje = 'Debes agregar al menos un sector para este evento.';
          this.tipoMensaje = 'error';
        } else if (modo === 'butaca') {
          this.mensaje = 'Debes agregar al menos una butaca para este evento.';
          this.tipoMensaje = 'error';
        } else {
          this.mensaje = 'Debes agregar al menos un sector o una butaca para este evento.';
          this.tipoMensaje = 'error';
        }
      } else {
        this.mensaje = 'Por favor completá todos los campos correctamente.';
        this.tipoMensaje = 'error';
      }
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
      // Si el admin no marcó el punto, se omite el campo en vez de mandar null,
      // para que el evento quede igual que los que nunca tuvieron ubicación.
      ...(raw.ubicacion ? { ubicacion: raw.ubicacion as Ubicacion } : {}),
      imagen: String(raw.imagen ?? ''),
      categoria: String(raw.categoria ?? ''),
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
          this.mensaje = 'Evento actualizado con éxito';
          this.tipoMensaje = 'success';

          // Si viene desde @Input, emitir el evento actualizado
          if (this.isEditing) {
            this.edited.emit(evento);
            this.cancelled.emit();
          }
          
          this.cancelarEdicion();
        },
        error: err => {
          this.modalService.notify('No se pudo actualizar el evento. Intenta nuevamente en unos minutos.');
        }
      });
    } else {
      delete (evento as any).id;
      this.eventoService.crearEvento(evento).subscribe({
        next: (nuevoEvento: Evento) => {
          this.eventos.update(eventos => [...eventos, nuevoEvento]);
          this.mensaje = '🎉 Evento creado con éxito';
          this.tipoMensaje = 'success';
          this.cancelarEdicion();
        },
        error: err => {
          this.modalService.notify('No se pudo crear el evento. Intenta nuevamente en unos minutos.');
        }
      });
    }
  }

  eliminarEvento(id: number | undefined): void {
    if (!id) return;
    
    this.pendingAction = 'eliminarEvento';
    this.pendingData = id;
    this.confirmMessage.set('¿Está seguro que desea eliminar este evento?');
    this.showConfirmModal.set(true);
  }

  private confirmarEliminarEvento() {
    if (this.pendingData === null) return;
    
    const id = this.pendingData;
    this.eventos.update(eventos => eventos.filter(e => e.id !== id));

    this.eventoService.borrarEvento(id).subscribe({
      next: () => {
        this.mensaje = 'Evento eliminado con éxito';
        this.tipoMensaje = 'success';
      },
      error: err => {
        this.cargarEventos();
        this.modalService.notify('No se pudo eliminar el evento. Intenta nuevamente en unos minutos.');
      }
    });
    
    this.closeConfirmModal();
  }

  navegarAdetalles(id: number | undefined): void {
    if (id != null) {
      this.router.navigate(['/ficha-evento', id]);
    }
  }

  closeConfirmModal(): void {
    this.showConfirmModal.set(false);
    this.pendingAction = null;
    this.pendingData = null;
    this.confirmMessage.set('');
  }

  confirmAction(): void {
    switch (this.pendingAction) {
      case 'eliminarSector':
        this.confirmarEliminarSector();
        break;
      case 'eliminarButaca':
        this.confirmarEliminarButaca();
        break;
      case 'limpiarButacas':
        this.confirmarLimpiarButacas();
        break;
      case 'generarButacas':
        this.confirmarGenerarButacas();
        break;
      case 'eliminarEvento':
        this.confirmarEliminarEvento();
        break;
    }
  }
}
import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { TarjetaServicio } from '../servicios/tarjeta.servicio';
import { ModalConfirmacionService } from '../servicios/modal-confirmacion.service';
import { Tarjeta } from '../modelos/tarjeta';

export const tarjetaNoVencidaValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (!control.value) return null;
  
  const match = control.value.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return null; 
  
  const mes = parseInt(match[1], 10);
  const año = parseInt(match[2], 10) + 2000;
  
  const hoy = new Date();
  const mesActual = hoy.getMonth() + 1; 
  const añoActual = hoy.getFullYear();
  
  if (año < añoActual) {
    return { tarjetaVencida: true };
  }
  
  if (año === añoActual && mes < mesActual) {
    return { tarjetaVencida: true };
  }
  
  return null;
};

/**
 * Titular válido: se admiten espacios entre las palabras (para separar nombre y
 * apellido) pero no al principio ni al final. Así deja de pasar un titular
 * cargado sólo con espacios, que con `minLength` solo se daba por bueno.
 */
export const titularValidoValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const valor = control.value;
  if (typeof valor !== 'string' || valor === '') return null;
  return valor !== valor.trim() ? { espaciosEnLosBordes: true } : null;
};

@Component({
  selector: 'app-mis-tarjetas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './mis-tarjetas.html',
  styleUrls: ['./mis-tarjetas.css']
})
export class MisTarjetas implements OnInit {
  usuario: any = null;
  tarjetas = signal<Tarjeta[]>([]);
  isLoading = signal(true);
  mostrarFormulario = signal(false);
  tarjetaExpandida = signal<string | null>(null);
  tarjetaForm: FormGroup;

  private readonly tarjetaService = inject(TarjetaServicio);
  private readonly router = inject(Router);
  protected readonly modalService = inject(ModalConfirmacionService);
  private readonly fb = inject(FormBuilder);

  mensaje: string = '';
  tipoMensaje: 'error' | 'success' | '' = '';

  constructor() {
    this.tarjetaForm = this.fb.group({
      numeroTarjeta: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
      titular: ['', [Validators.required, Validators.minLength(3), titularValidoValidator]],
      vencimiento: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/), tarjetaNoVencidaValidator]],
      cvv: ['', [Validators.required, Validators.pattern(/^\d{3}$/)]],
      tipo: ['Visa', Validators.required],
      esPrincipal: [false]
    });
  }

  get vencimiento(){
    return this.tarjetaForm.controls['vencimiento'];
  }

  async ngOnInit() {
    const data = localStorage.getItem('usuarioLogueado');
    this.usuario = data ? JSON.parse(data) : null;

    if (!this.usuario) {
      await this.modalService.notify('Debes iniciar sesión para ver tus tarjetas.');
      this.router.navigate(['/login']);
      return;
    }

    this.cargarTarjetas();
  }

  cargarTarjetas(): void {
    this.isLoading.set(true);

    this.tarjetaService.obtenerTarjetasPorUsuario(this.usuario.id).subscribe({
      next: (tarjetas) => {
        this.tarjetas.set(tarjetas);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.tarjetas.set([]);
        this.isLoading.set(false);
        this.modalService.notify('No se pudieron cargar tus tarjetas. Intenta nuevamente en unos minutos.');
      }
    });
  }

  toggleFormulario(): void {
    this.mostrarFormulario.update(v => !v);
    if (!this.mostrarFormulario()) {
      this.tarjetaForm.reset({ tipo: 'Visa', esPrincipal: false });
    }
  }

  agregarTarjeta(): void {
    if (this.tarjetaForm.invalid) {
      this.tarjetaForm.markAllAsTouched();
      return;
    }

    const formValue = this.tarjetaForm.value;
    
    // Obtener solo los últimos 4 dígitos para guardar
    const ultimosDigitos = formValue.numeroTarjeta.slice(-4);

    const nuevaTarjeta: Tarjeta = {
      usuarioId: this.usuario.id,
      numeroTarjeta: ultimosDigitos,
      titular: formValue.titular,
      vencimiento: formValue.vencimiento,
      tipo: formValue.tipo,
      esPrincipal: this.tarjetas().length === 0 ? true : formValue.esPrincipal,
      fechaAgregada: new Date().toISOString()
    };

    this.tarjetaService.agregarTarjeta(nuevaTarjeta).subscribe({
      next: (tarjeta) => {
        // Si es la tarjeta principal, desmarca las demás
        if (tarjeta.esPrincipal && this.tarjetas().length > 0) {
          this.actualizarTarjetasPrincipales(tarjeta.id!);
        }
        
        this.tarjetas.update(tarjetas => [...tarjetas, tarjeta]);
        this.tarjetaForm.reset({ tipo: 'Visa', esPrincipal: false });
        this.mostrarFormulario.set(false);
        this.mensaje = 'Tarjeta agregada con éxito';
        this.tipoMensaje = 'success';
      },
      error: (err) => {
        this.modalService.notify('No se pudo agregar la tarjeta. Intenta nuevamente en unos minutos.');
      }
    });
  }

  async eliminarTarjeta(tarjeta: Tarjeta): Promise<void> {
    const confirmar = await this.modalService.confirm(`¿Estás seguro de eliminar la tarjeta terminada en ${tarjeta.numeroTarjeta}?`);
    if (!confirmar) return;

    if (tarjeta.id) {
      this.tarjetaService.eliminarTarjeta(tarjeta.id).subscribe({
        next: () => {
          this.tarjetas.update(tarjetas => tarjetas.filter(t => t.id !== tarjeta.id));
          this.mensaje = 'Tarjeta eliminada con éxito';
          this.tipoMensaje = 'success';
        },
        error: (err) => {
          this.modalService.notify('No se pudo eliminar la tarjeta. Intenta nuevamente en unos minutos.');
        }
      });
    }
  }

  establecerPrincipal(tarjeta: Tarjeta): void {
    if (!tarjeta.id) return;

    this.actualizarTarjetasPrincipales(tarjeta.id);
  }

  private actualizarTarjetasPrincipales(tarjetaPrincipalId: string): void {
    const actuales = this.tarjetas();

    const siguientes = actuales.map(t =>
      t.esPrincipal === (t.id === tarjetaPrincipalId)
        ? t
        : { ...t, esPrincipal: t.id === tarjetaPrincipalId }
    );

    // Sólo se persisten las que realmente cambiaron de estado: antes se mandaba
    // un PUT por cada tarjeta del usuario aunque ninguna otra se hubiera tocado.
    const cambiadas = siguientes.filter((t, i) => t !== actuales[i]);

    this.tarjetas.set(siguientes);

    cambiadas.forEach(t => {
      if (t.id) {
        this.tarjetaService.actualizarTarjeta(t).subscribe({
          error: (err) => {}
        });
      }
    });
  }

  obtenerIconoTarjeta(tipo: string): string {
    switch (tipo) {
      default: return '💳';
    }
  }

  formatearNumeroTarjeta(numero: string): string {
    return `•••• •••• •••• ${numero}`;
  }

  toggleDetalles(tarjetaId: string | undefined) {
    if (!tarjetaId) return;
    if (this.tarjetaExpandida() === tarjetaId) {
      this.tarjetaExpandida.set(null);
    } else {
      this.tarjetaExpandida.set(tarjetaId);
    }
  }

  mostrarDetalles(tarjetaId: string | undefined): boolean {
    if (!tarjetaId) return false;
    return this.tarjetaExpandida() === tarjetaId;
  }
}

import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { TarjetaServicio } from '../servicios/tarjeta.servicio';
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
  private readonly fb = inject(FormBuilder);

  constructor() {
    this.tarjetaForm = this.fb.group({
      numeroTarjeta: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
      titular: ['', [Validators.required, Validators.minLength(3)]],
      vencimiento: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/), tarjetaNoVencidaValidator]],
      cvv: ['', [Validators.required, Validators.pattern(/^\d{3}$/)]],
      tipo: ['Visa', Validators.required],
      esPrincipal: [false]
    });
  }

  get vencimiento(){
    return this.tarjetaForm.controls['vencimiento'];
  }

  ngOnInit() {
    const data = localStorage.getItem('usuarioLogueado');
    this.usuario = data ? JSON.parse(data) : null;

    if (!this.usuario) {
      alert('Debes iniciar sesión para administrar tus tarjetas');
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
        alert('Tarjeta agregada correctamente');
      },
      error: (err) => {
        alert('Error al agregar tarjeta');
      }
    });
  }

  eliminarTarjeta(tarjeta: Tarjeta): void {
    if (!confirm(`¿Estás seguro de eliminar la tarjeta terminada en ${tarjeta.numeroTarjeta}?`)) {
      return;
    }

    if (tarjeta.id) {
      this.tarjetaService.eliminarTarjeta(tarjeta.id).subscribe({
        next: () => {
          this.tarjetas.update(tarjetas => tarjetas.filter(t => t.id !== tarjeta.id));
          alert('Tarjeta eliminada');
        },
        error: (err) => {
          alert('Error al eliminar tarjeta');
        }
      });
    }
  }

  establecerPrincipal(tarjeta: Tarjeta): void {
    if (!tarjeta.id) return;

    this.actualizarTarjetasPrincipales(tarjeta.id);
  }

  private actualizarTarjetasPrincipales(tarjetaPrincipalId: string): void {
   
    this.tarjetas.update(tarjetas => 
      tarjetas.map(t => ({
        ...t,
        esPrincipal: t.id === tarjetaPrincipalId
      }))
    );

   
    this.tarjetas().forEach(t => {
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

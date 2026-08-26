import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Autenticador } from '../servicios/autenticador';
import { ModalConfirmacionService } from '../servicios/modal-confirmacion.service';
import { Icono } from '../ui/icono';
import { inject } from '@angular/core';

@Component({
  selector: 'app-iniciar-sesion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, Icono],
  templateUrl: './iniciar-sesion.html',
  styleUrls: ['./iniciar-sesion.css']
})
export class IniciarSesion {

  private readonly fb = inject(FormBuilder);
  private readonly autenticador = inject(Autenticador);
  private readonly modalService = inject(ModalConfirmacionService);

  mensaje: string = '';
  tipoMensaje: 'error' | 'success' | '' = '';
  mostrarContrasena: boolean = false;

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    contrasena: ['', [Validators.required, Validators.minLength(6)]]
  });

  iniciarSesion() {
    if (this.form.invalid) {
      this.mensaje = 'Todos los campos son obligatorios.';
      this.tipoMensaje = 'error';
      return;
    }
      const email = this.form.get('email')?.value;
    const contrasena = this.form.get('contrasena')?.value;

    if (!email || !contrasena) {
      this.mensaje = 'Datos de formulario inválidos';
      this.tipoMensaje = 'error';
      return;
    }

    this.autenticador.buscarPorCredenciales(email, contrasena).subscribe({
      next: (usuarios) => {
        if (usuarios.length > 0) {
          const usuario = usuarios[0];
          localStorage.setItem('usuarioLogueado', JSON.stringify(usuario));
          this.mensaje = '';
          this.tipoMensaje = '';

          this.form.reset();
          // Recargar la página completamente
          window.location.href = '/menu-principal';
        } else {
          this.mensaje = 'Email o contraseña incorrectos';
          this.tipoMensaje = 'error';
        }
      },
      error: (err) => {
        this.modalService.notify('No se pudo conectar con el servidor. Intenta nuevamente en unos minutos.');
      }
    });
  }
}
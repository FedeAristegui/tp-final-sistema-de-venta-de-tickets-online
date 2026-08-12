import { Component, inject } from '@angular/core';
import { usuario } from '../modelos/usuario';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Autenticador } from '../servicios/autenticador';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { RouterLink } from "@angular/router";

// Validador: rechaza espacios en blanco al inicio o al final del valor
export const sinEspaciosBordeValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  if (!value) return null;
  const errores: ValidationErrors = {};
  if (/^\s/.test(value)) errores['espacioInicio'] = true;
  if (/\s$/.test(value)) errores['espacioFinal'] = true;
  return Object.keys(errores).length > 0 ? errores : null;
};

@Component({
  selector: 'app-registrarse',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registrarse.html',
  styleUrls: ['./registrarse.css'],
})
export class Registrarse {
  
  private readonly fb = inject(FormBuilder);
  private readonly autenticador = inject(Autenticador);

  mensaje: string = '';
  tipoMensaje: 'error' | 'success' | '' = '';

  protected readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3),Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/), sinEspaciosBordeValidator]],
    apellido: ['', [Validators.required, Validators.minLength(3),Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/), sinEspaciosBordeValidator]], 
    email: ['', [Validators.required, Validators.email]],
    contrasena: ['', [Validators.required, Validators.minLength(6), sinEspaciosBordeValidator]],
    rol: ['usuario', Validators.required]
  });

   registrar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.mensaje = 'Por favor, completa todos los campos correctamente.';
      this.tipoMensaje = 'error';
      return;
    }

    const nuevoUsuario: usuario = this.form.value as usuario;

    // Verifica si el email ya está registrado
    this.autenticador.obtenerUsuarios().subscribe({
      next: usuarios => {
        const existe = usuarios.some(u => u.email === nuevoUsuario.email);
        if (existe) {
          this.mensaje = 'El email ya está registrado. Por favor, utiliza otro email.';
          this.tipoMensaje = 'error';
          return;
        }

        // Si no existe, registra el mail
        this.autenticador.registrarUsuario(nuevoUsuario).subscribe({
          next: () => {
            this.mensaje = 'Usuario registrado exitosamente. Ahora puedes iniciar sesión.';
            this.tipoMensaje = 'success';
            this.form.reset({ rol: 'usuario' });
          },
          error: err => {
            this.mensaje = 'Ocurrió un error al registrar el usuario.';
            this.tipoMensaje = 'error';
          }
        });
      },
      error: err => {
        this.mensaje = 'No se pudo verificar el email.';
        this.tipoMensaje = 'error';
      }
    });
  }
}
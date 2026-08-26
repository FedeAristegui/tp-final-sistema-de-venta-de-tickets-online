import { Component, inject } from '@angular/core';
import { usuario } from '../modelos/usuario';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Autenticador } from '../servicios/autenticador';
import { ModalConfirmacionService } from '../servicios/modal-confirmacion.service';
import { Icono } from '../ui/icono';
import { FormBuilder, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Validador: rechaza espacios en blanco al inicio o al final del valor
export const sinEspaciosBordeValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  if (!value) return null;
  const errores: ValidationErrors = {};
  if (/^\s/.test(value)) errores['espacioInicio'] = true;
  if (/\s$/.test(value)) errores['espacioFinal'] = true;
  return Object.keys(errores).length > 0 ? errores : null;
};

/** Parte anterior al `@`: palabras separadas por puntos, sin puntos sueltos ni pegados. */
const PARTE_LOCAL = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;

/** Cada tramo del dominio: letras, números y guiones, nunca empezando ni terminando en guión. */
const ETIQUETA_DOMINIO = /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/;

/**
 * Validador de email más estricto que `Validators.email`.
 *
 * El de Angular es deliberadamente permisivo y da por bueno un dominio sin punto
 * ni extensión, así que aceptaba direcciones como `juan@j`. Acá se exige un
 * dominio con al menos dos tramos y una extensión de dos o más letras.
 *
 * Importante: esto valida la FORMA del dominio, no que exista de verdad. Para
 * eso hace falta una consulta DNS o un mail de confirmación.
 */
export const emailValidoValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const valor = control.value;
  // De los vacíos se ocupa `Validators.required`.
  if (typeof valor !== 'string' || valor.trim() === '') return null;

  const partes = valor.split('@');
  if (partes.length !== 2) return { emailFormato: true };

  const [local, dominio] = partes;
  if (local.length > 64 || !PARTE_LOCAL.test(local)) return { emailFormato: true };

  const etiquetas = dominio.split('.');
  // Un solo tramo significa que no hay extensión: el caso `juan@j`.
  if (etiquetas.length < 2) return { emailDominio: true };
  if (!etiquetas.every(etiqueta => ETIQUETA_DOMINIO.test(etiqueta))) return { emailDominio: true };
  if (!/^[A-Za-z]{2,}$/.test(etiquetas[etiquetas.length - 1])) return { emailDominio: true };

  return null;
};

@Component({
  selector: 'app-registrarse',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, Icono],
  templateUrl: './registrarse.html',
  styleUrls: ['./registrarse.css'],
})
export class Registrarse {

  private readonly fb = inject(FormBuilder);
  private readonly autenticador = inject(Autenticador);
  private readonly modalService = inject(ModalConfirmacionService);

  mensaje: string = '';
  tipoMensaje: 'error' | 'success' | '' = '';
  mostrarContrasena: boolean = false;

  protected readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3),Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/), sinEspaciosBordeValidator]],
    apellido: ['', [Validators.required, Validators.minLength(3),Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/), sinEspaciosBordeValidator]], 
    // Se reemplaza `Validators.email` por el validador propio: el de Angular
    // dejaba pasar dominios sin extensión.
    email: ['', [Validators.required, emailValidoValidator]],
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
            this.modalService.notify('No se pudo registrar el usuario. Intenta nuevamente en unos minutos.');
          }
        });
      },
      error: err => {
        this.modalService.notify('No se pudo conectar con el servidor. Intenta nuevamente en unos minutos.');
      }
    });
  }
}
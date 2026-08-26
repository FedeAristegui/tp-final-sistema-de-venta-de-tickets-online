import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Autenticador } from '../servicios/autenticador';
import { EmailService } from '../servicios/email.service';
import { usuario } from '../modelos/usuario';
import { Icono } from '../ui/icono';

// Validador: confirma que "nuevaContrasena" y "confirmarContrasena" coincidan
function contrasenasIgualesValidator(control: AbstractControl): ValidationErrors | null {
  const nueva = control.get('nuevaContrasena')?.value;
  const confirmar = control.get('confirmarContrasena')?.value;
  return nueva && confirmar && nueva !== confirmar ? { contrasenasDistintas: true } : null;
}

@Component({
  selector: 'app-recuperar-contrasena',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, Icono],
  templateUrl: './recuperar-contrasena.html',
  styleUrls: ['./recuperar-contrasena.css']
})
export class RecuperarContrasena {
  private readonly fb = inject(FormBuilder);
  private readonly autenticador = inject(Autenticador);
  private readonly emailService = inject(EmailService);
  private readonly router = inject(Router);

  // paso 1: pedir email | paso 2: ingresar código + nueva contraseña
  paso = signal<1 | 2>(1);
  enviando = signal<boolean>(false);
  mensaje: string = '';
  tipoMensaje: 'error' | 'success' | '' = '';
  mostrarNuevaContrasena: boolean = false;
  mostrarConfirmarContrasena: boolean = false;

  private usuarioEncontrado: usuario | null = null;

  formEmail = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  formCodigo = this.fb.group({
    codigo: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    nuevaContrasena: ['', [Validators.required, Validators.minLength(6)]],
    confirmarContrasena: ['', [Validators.required]]
  }, { validators: contrasenasIgualesValidator });

  solicitarCodigo() {
    if (this.formEmail.invalid) {
      this.formEmail.markAllAsTouched();
      return;
    }

    const email = this.formEmail.get('email')?.value!;
    this.enviando.set(true);
    this.mensaje = '';

    this.autenticador.buscarPorEmail(email).subscribe({
      next: (usuarios) => {
        if (usuarios.length === 0) {
          this.enviando.set(false);
          this.mensaje = 'No existe una cuenta registrada con ese email.';
          this.tipoMensaje = 'error';
          return;
        }

        this.usuarioEncontrado = usuarios[0];
        const codigo = Math.floor(100000 + Math.random() * 900000).toString();

        this.autenticador.guardarCodigoRecuperacion(this.usuarioEncontrado.id!, codigo).subscribe({
          next: () => {
            this.emailService.enviarCodigoRecuperacion(
              email,
              `${this.usuarioEncontrado?.nombre || ''} ${this.usuarioEncontrado?.apellido || ''}`.trim(),
              codigo
            ).then(() => {
              this.enviando.set(false);
              this.mensaje = 'Te enviamos un código de 6 dígitos a tu email. Revisa tu bandeja de entrada.';
              this.tipoMensaje = 'success';
              this.paso.set(2);
            }).catch(() => {
              this.enviando.set(false);
              this.mensaje = 'No se pudo enviar el email. Intenta nuevamente en unos minutos.';
              this.tipoMensaje = 'error';
            });
          },
          error: () => {
            this.enviando.set(false);
            this.mensaje = 'No se pudo generar el código. Intenta nuevamente en unos minutos.';
            this.tipoMensaje = 'error';
          }
        });
      },
      error: () => {
        this.enviando.set(false);
        this.mensaje = 'No se pudo conectar con el servidor. Intenta nuevamente en unos minutos.';
        this.tipoMensaje = 'error';
      }
    });
  }

  confirmarNuevaContrasena() {
    if (this.formCodigo.invalid || !this.usuarioEncontrado) {
      this.formCodigo.markAllAsTouched();
      return;
    }

    const codigo = this.formCodigo.get('codigo')?.value!;
    const nuevaContrasena = this.formCodigo.get('nuevaContrasena')?.value!;

    // Se vuelve a pedir el usuario para validar contra el código más reciente guardado en el servidor
    this.enviando.set(true);
    this.mensaje = '';

    this.autenticador.buscarPorEmail(this.usuarioEncontrado.email).subscribe({
      next: (usuarios) => {
        const usuarioActual = usuarios[0];
        if (!usuarioActual || !this.autenticador.validarCodigoRecuperacion(usuarioActual, codigo)) {
          this.enviando.set(false);
          this.mensaje = 'El código ingresado es inválido o expiró. Solicita uno nuevo.';
          this.tipoMensaje = 'error';
          return;
        }

        this.autenticador.restablecerContrasena(usuarioActual.id!, nuevaContrasena).subscribe({
          next: () => {
            this.enviando.set(false);
            this.mensaje = 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.';
            this.tipoMensaje = 'success';
            setTimeout(() => this.router.navigate(['/login']), 1500);
          },
          error: () => {
            this.enviando.set(false);
            this.mensaje = 'No se pudo actualizar la contraseña. Intenta nuevamente en unos minutos.';
            this.tipoMensaje = 'error';
          }
        });
      },
      error: () => {
        this.enviando.set(false);
        this.mensaje = 'No se pudo conectar con el servidor. Intenta nuevamente en unos minutos.';
        this.tipoMensaje = 'error';
      }
    });
  }

  volverAEmail() {
    this.paso.set(1);
    this.mensaje = '';
    this.tipoMensaje = '';
    this.formCodigo.reset();
    this.mostrarNuevaContrasena = false;
    this.mostrarConfirmarContrasena = false;
  }
}

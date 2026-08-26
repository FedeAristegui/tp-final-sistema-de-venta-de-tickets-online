import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { Autenticador } from '../servicios/autenticador';
import { ModalConfirmacionService } from '../servicios/modal-confirmacion.service';
import { usuario } from '../modelos/usuario';
import { Icono } from '../ui/icono';

// Validador: confirma que "nuevaContrasena" y "confirmarContrasena" coincidan
function contrasenasIgualesValidator(control: AbstractControl): ValidationErrors | null {
  const nueva = control.get('nuevaContrasena')?.value;
  const confirmar = control.get('confirmarContrasena')?.value;
  return nueva && confirmar && nueva !== confirmar ? { contrasenasDistintas: true } : null;
}

// Validador: la nueva contraseña no puede ser igual a la actual
function nuevaContrasenaIgualActualValidator(control: AbstractControl): ValidationErrors | null {
  const actual = control.get('contrasenaActual')?.value;
  const nueva = control.get('nuevaContrasena')?.value;
  return actual && nueva && actual === nueva ? { mismaContrasena: true } : null;
}

@Component({
  selector: 'app-perfil-usuario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Icono],
  templateUrl: './perfil-usuario.html',
  styleUrls: ['./perfil-usuario.css']
})
export class PerfilUsuario implements OnInit {
  private readonly autenticador = inject(Autenticador);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly modalService = inject(ModalConfirmacionService);

  usuario: usuario | null = null;
  editando: boolean = false;
  cambiandoContrasena: boolean = false;
  guardando: boolean = false;
  mostrarContrasenaActual: boolean = false;
  mostrarNuevaContrasena: boolean = false;
  mostrarConfirmarContrasena: boolean = false;
  mensaje: string = '';
  tipoMensaje: 'error' | 'success' | '' = '';
  perfilForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    apellido: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]]
  });

  contrasenaForm: FormGroup = this.fb.group({
    contrasenaActual: ['', [Validators.required]],
    nuevaContrasena: ['', [Validators.required, Validators.minLength(6)]],
    confirmarContrasena: ['', [Validators.required]]
  }, { validators: [contrasenasIgualesValidator, nuevaContrasenaIgualActualValidator] });

  ngOnInit() {
    this.cargarPerfil();
  }

 
  cargarPerfil() {
    this.usuario = this.autenticador.obtenerUsuarioActual();
    if (!this.usuario) {
      this.router.navigate(['/login']);
    } else {
      this.perfilForm.patchValue({
        nombre: this.usuario.nombre,
        apellido: this.usuario.apellido,
        email: this.usuario.email
      });
    }
  }

  activarEdicion() {
    this.editando = true;
  }

  cancelarEdicion() {
    this.editando = false;
    this.cambiandoContrasena = false;
    this.contrasenaForm.reset();
    this.cargarPerfil();
  }

  toggleCambiarContrasena() {
    this.cambiandoContrasena = !this.cambiandoContrasena;
    this.contrasenaForm.reset();
    this.mostrarContrasenaActual = false;
    this.mostrarNuevaContrasena = false;
    this.mostrarConfirmarContrasena = false;
  }

  
  guardarCambios() {
    if (this.perfilForm.invalid || (this.cambiandoContrasena && this.contrasenaForm.invalid)) {
      this.perfilForm.markAllAsTouched();
      if (this.cambiandoContrasena) {
        this.contrasenaForm.markAllAsTouched();
      }
      this.mensaje = this.cambiandoContrasena && this.contrasenaForm.errors?.['mismaContrasena']
        ? 'La nueva contraseña es igual a la actual. No se puede realizar el cambio'
        : 'Por favor completa todos los campos correctamente';
      this.tipoMensaje = 'error';
      setTimeout(() => { this.mensaje = ''; this.tipoMensaje = ''; }, 3000);
      return;
    }

    if (!this.usuario) return;

    if (this.cambiandoContrasena) {
      const contrasenaActual = this.contrasenaForm.get('contrasenaActual')?.value;
      // Se valida la contraseña actual contra el servidor antes de tocar cualquier dato
      this.guardando = true;
      this.autenticador.buscarPorCredenciales(this.usuario.email, contrasenaActual).subscribe({
        next: (usuarios) => {
          this.guardando = false;
          if (usuarios.length === 0) {
            this.mensaje = 'La contraseña actual es incorrecta';
            this.tipoMensaje = 'error';
            setTimeout(() => { this.mensaje = ''; this.tipoMensaje = ''; }, 3000);
            return;
          }
          this.guardarPerfilYContrasena();
        },
        error: () => {
          this.guardando = false;
          this.modalService.notify('No se pudo verificar la contraseña actual. Intenta nuevamente en unos minutos.');
        }
      });
    } else {
      this.guardarPerfilYContrasena();
    }
  }

  private guardarPerfilYContrasena() {
    if (!this.usuario) return;

    const usuarioActualizado: usuario = {
      ...this.usuario,
      nombre: this.perfilForm.get('nombre')?.value,
      apellido: this.perfilForm.get('apellido')?.value,
      ...(this.cambiandoContrasena
        ? { contrasena: this.contrasenaForm.get('nuevaContrasena')?.value }
        : {})
    };

    this.autenticador.actualizarUsuario(usuarioActualizado).subscribe({
      next: (usuario) => {
        localStorage.setItem('usuarioLogueado', JSON.stringify(usuario));
        this.usuario = usuario;
        this.mensaje = this.cambiandoContrasena
          ? 'Perfil y contraseña actualizados correctamente'
          : 'Perfil actualizado correctamente';
        this.tipoMensaje = 'success';
        this.editando = false;
        this.cambiandoContrasena = false;
        this.contrasenaForm.reset();
        setTimeout(() => { this.mensaje = ''; this.tipoMensaje = ''; }, 3000);
      },
      error: (err) => {
        this.modalService.notify('No se pudo actualizar el perfil. Intenta nuevamente en unos minutos.');
      }
    });
  }
}
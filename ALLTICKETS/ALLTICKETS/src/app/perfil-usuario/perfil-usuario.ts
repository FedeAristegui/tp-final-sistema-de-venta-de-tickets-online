import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Autenticador } from '../servicios/autenticador';
import { ModalConfirmacionService } from '../servicios/modal-confirmacion.service';
import { usuario } from '../modelos/usuario';
import { PaginaPrincipal } from '../pagina-principal/pagina-principal';

@Component({
  selector: 'app-perfil-usuario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
  mensaje: string = '';
  tipoMensaje: 'error' | 'success' | '' = '';
  perfilForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    apellido: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]]
  });

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
    this.cargarPerfil();
  }

  
  guardarCambios() {
    if (this.perfilForm.invalid) {
      this.perfilForm.markAllAsTouched();
      this.mensaje = 'Por favor completa todos los campos correctamente';
      this.tipoMensaje = 'error';
      setTimeout(() => { this.mensaje = ''; this.tipoMensaje = ''; }, 3000);
      return;
    }

    if (this.usuario) {
      const usuarioActualizado = {
        ...this.usuario,
        nombre: this.perfilForm.get('nombre')?.value,
        apellido: this.perfilForm.get('apellido')?.value,
      };

      this.autenticador.actualizarUsuario(usuarioActualizado).subscribe({
        next: (usuario) => {
          localStorage.setItem('usuarioLogueado', JSON.stringify(usuario));
          this.usuario = usuario;
          this.mensaje = 'Perfil actualizado correctamente';
          this.tipoMensaje = 'success';
          this.editando = false;
          setTimeout(() => { this.mensaje = ''; this.tipoMensaje = ''; }, 3000);
        },
        error: (err) => {
          this.modalService.notify('No se pudo actualizar el perfil. Intenta nuevamente en unos minutos.');
        }
      });
    }
  }
}
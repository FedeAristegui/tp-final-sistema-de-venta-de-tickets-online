import { Component } from '@angular/core';
import { usuario } from '../usuario';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Autenticador } from '../autenticador';

@Component({
  selector: 'app-registrarse',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registrarse.html',
  styleUrls: ['./registrarse.css'],
})
export class Registrarse {
  usuario: usuario = {
    nombre: '',
    apellido: '',
    email: '',
    contrasena: ''
  };
  
  constructor(private autenticador: Autenticador) {}
  errors: Record<string, string> = {};


  validateUsuario(): boolean {
    this.errors = {};

    if (!this.usuario.nombre || this.usuario.nombre.trim().length < 2) {
      this.errors['nombre'] = 'El nombre debe tener al menos 2 caracteres.';
    }

    if (!this.usuario.apellido || this.usuario.apellido.trim().length < 2) {
      this.errors['apellido'] = 'El apellido debe tener al menos 2 caracteres.';
    }

        const soloLetras = /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/;
    if (!soloLetras.test(this.usuario.nombre || '')) {
      this.errors['nombre'] = 'El nombre no debe contener números';
    }

    if (!soloLetras.test(this.usuario.apellido || '')) {
      this.errors['apellido'] = 'El apellido no debe contener números';

    }

    if (!this.usuario.email) {
      this.errors['email'] = 'El email es obligatorio.';
    } else {
      const re = /^\S+@\S+\.\S+$/;
      if (!re.test(this.usuario.email)) {
        this.errors['email'] = 'El email no tiene un formato válido.';
      }
    }

    if (!this.usuario.contrasena || this.usuario.contrasena.length < 6 || this.usuario.contrasena.length > 20) {
          this.errors['contrasena'] = 'La contraseña debe tener entre 6 y 20 caracteres.';
    }

    return Object.keys(this.errors).length === 0;
  }

  registrar() {
    const valid = this.validateUsuario();
    if (!valid) {
      console.warn('Errores de validación:', this.errors);
      return;
    }

    console.log('Registrando usuario válido:', this.usuario);

    this.autenticador.registrarUsuario(this.usuario).subscribe({
      next: (res) => {
        console.log('Usuario guardado en el servidor:', res);
        // reset form model and errors
        this.usuario = { nombre: '', apellido: '', email: '', contrasena: '' };
        this.errors = {};
      },
      error: (err) => {
        console.error('Error guardando usuario en el servidor:', err);
        this.errors['server'] = 'Error al guardar el usuario. Intente más tarde.';
      }
    });
  }


}
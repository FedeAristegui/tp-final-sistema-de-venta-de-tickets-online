import { Component } from '@angular/core';
import { usuario } from '../usuario';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Autenticador } from '../autenticador';
import { NgForm } from '@angular/forms';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-registrarse',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './registrarse.html',
  styleUrls: ['./registrarse.css'],
})
export class Registrarse {
  usuario: usuario = {
    
    nombre: '',
    apellido: '',
    email: '',
    contrasena: '',
    rol: 'usuario'
  };
  
  constructor(private autenticador: Autenticador) {}
  


  validateUsuario(): boolean {
    if (!this.usuario.nombre || this.usuario.nombre.trim().length < 2) {
      alert('El nombre debe tener al menos 2 caracteres.');
      return false;
    }

    if (!this.usuario.apellido || this.usuario.apellido.trim().length < 2) {
      alert('El apellido debe tener al menos 2 caracteres.');
      return false;
    }

    const soloLetras = /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/;
    if (!soloLetras.test(this.usuario.nombre || '')) {
      alert('El nombre no debe contener números');
      return false;
    }

    if (!soloLetras.test(this.usuario.apellido || '')) {
      alert('El apellido no debe contener números');
      return false;
    }

    if (!this.usuario.email) {
      alert('El email es obligatorio.');
      return false;
    } else {
      const re = /^\S+@\S+\.\S+$/;
      if (!re.test(this.usuario.email)) {
        alert('El email no tiene un formato válido.');
        return false;
      }
    } 

    if (!this.usuario.contrasena || this.usuario.contrasena.length < 6 || this.usuario.contrasena.length > 20) {
      alert('La contraseña debe tener entre 6 y 20 caracteres.');
      return false;
    }

    return true;
  }

  registrar(form: NgForm) {
    const formatoValido = this.validateUsuario();
    
    if (!formatoValido) {
      console.warn('Errores de validación, se detuvo.');
      return; 
    }

    this.autenticador.obtenerUsuarios().subscribe(usuarios => {
      
      const emailYaRegistrado = usuarios.some(
        user => user.email === this.usuario.email
      );

      if (emailYaRegistrado) {
        alert('El email ya está registrado.'); 
        return; 
      }
      
      this.autenticador.registrarUsuario(this.usuario).subscribe({
        next: (res) => {
          alert('¡Usuario registrado con éxito!');
          form.resetForm();
          this.usuario.rol = 'usuario';

        },
        error: (err) => {
          console.error('Error guardando usuario en el servidor:', err);
          alert('Error al guardar el usuario. Causa: ' + err.message); 
        }
      });
    });
  }
}
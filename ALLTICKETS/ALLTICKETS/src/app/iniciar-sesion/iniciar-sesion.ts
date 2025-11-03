import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { Autenticador } from '../autenticador';


@Component({
  selector: 'app-iniciar-sesion',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './iniciar-sesion.html',
  styleUrls: ['./iniciar-sesion.css']
})
export class IniciarSesion {
  email: string = '';
  contrasena: string = '';
  error: string = '';

  constructor(private autenticador: Autenticador, private router: Router) {}

  
iniciarSesion(loginForm: NgForm) {
  const { email, contrasena } = loginForm.value;

  if (!email || !contrasena) {
    this.error = 'Todos los campos son obligatorios';
    return;
  }

  this.autenticador.buscarPorCredenciales(email, contrasena).subscribe({
    next: (usuarios) => {
      if (usuarios.length > 0) {
        const usuario = usuarios[0];
        localStorage.setItem('usuarioLogueado', JSON.stringify(usuario));

        
        alert('Inicio de sesión exitoso ✅');

        // Limpiar formulario
        loginForm.resetForm();
        this.error = '';

        // Redirigir
        this.router.navigate(['/home']);
      } else {
        this.error = 'Email o contraseña incorrectos';
        alert('Email o contraseña incorrectos');
      }
    },
    error: (err) => {
      console.error('Error en el servidor:', err);
      this.error = 'Error en el servidor. Intenta más tarde.';
    }
  });
}
    }

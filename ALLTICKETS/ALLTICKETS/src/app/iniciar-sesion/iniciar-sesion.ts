import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Autenticador } from '../servicios/autenticador';
import { inject } from '@angular/core';

@Component({
  selector: 'app-iniciar-sesion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './iniciar-sesion.html',
  styleUrls: ['./iniciar-sesion.css']
})
export class IniciarSesion {
 
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly autenticador = inject(Autenticador);

  protected error: string | null = null;

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    contrasena: ['', [Validators.required, Validators.minLength(6)]]
  });

  iniciarSesion() {
    if (this.form.invalid) {
      this.error = 'Todos los campos son obligatorios.';
      
      return;
    }

      const email = this.form.get('email')?.value;
    const contrasena = this.form.get('contrasena')?.value;

    if (!email || !contrasena) {
      this.error = 'Datos de formulario inválidos';
      return;
    }

    this.autenticador.buscarPorCredenciales(email, contrasena).subscribe({
      next: (usuarios) => {
        if (usuarios.length > 0) {
          const usuario = usuarios[0];
          localStorage.setItem('usuarioLogueado', JSON.stringify(usuario));
          this.error = null;
          
          this.form.reset();
          // Recargar la página completamente
          window.location.href = '/menu-principal';
        } else {
          this.error = 'Email o contraseña incorrectos';
          alert(this.error);
        }
      },
      error: (err) => {
        console.error('Error en el servidor:', err);
        this.error = 'Error en el servidor. Intenta más tarde.';
      }
    });
  }
}
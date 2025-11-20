import { Component, inject } from '@angular/core';
import { usuario } from '../modelos/usuario';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Autenticador } from '../servicios/autenticador';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from "@angular/router";

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

  protected readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3),Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/)]],
    apellido: ['', [Validators.required, Validators.minLength(3),Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/)]], 
    email: ['', [Validators.required, Validators.email]],
    contrasena: ['', [Validators.required, Validators.minLength(6)]],
    rol: ['usuario', Validators.required]
  });

   registrar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      alert('Por favor, complete todos los campos correctamente.');
      return;
    }

    const nuevoUsuario: usuario = this.form.value as usuario;

    // Verifica si el email ya está registrado
    this.autenticador.obtenerUsuarios().subscribe({
      next: usuarios => {
        const existe = usuarios.some(u => u.email === nuevoUsuario.email);
        if (existe) {
          alert('El email ya está registrado.');
          return;
        }

        // Si no existe, registra el mail
        this.autenticador.registrarUsuario(nuevoUsuario).subscribe({
          next: () => {
            alert('Usuario registrado con éxito.');
            this.form.reset({ rol: 'usuario' });
          },
          error: err => {
            alert('Ocurrió un error al registrar el usuario.');
          }
        });
      },
      error: err => {
        alert('No se pudo verificar el email.');
      }
    });
  }
}
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { usuario } from  '../modelos/usuario';

@Injectable({
  providedIn: 'root',
})
export class Autenticador {
  private readonly http = inject(HttpClient);
  private url = 'http://localhost:3000/usuarios';

  // RF01 - Iniciar sesión
  buscarPorCredenciales(email: string, contrasena: string): Observable<usuario[]> {
    return this.http.get<usuario[]>(`${this.url}?email=${email}&contrasena=${contrasena}`);
  }

  // RF02 - Registrar usuario
  registrarUsuario(usuario: usuario): Observable<usuario> {
    const nuevoUsuario = {
      ...usuario,
      fechaRegistro: new Date().toISOString(),
      ultimaActividad: new Date().toISOString(),
      activo: true
    };
    return this.http.post<usuario>(this.url, nuevoUsuario);
  }

  obtenerUsuarios(): Observable<usuario[]> {
    return this.http.get<usuario[]>(this.url);
  }

  obtenerUsuario(id: string): Observable<usuario> {
    return this.http.get<usuario>(`${this.url}/${id}`);
  }

  // RF22 - Ver perfil y RF23 - Modificar datos
  actualizarUsuario(usuario: usuario): Observable<usuario> {
    const usuarioActualizado = {
      ...usuario,
      ultimaActividad: new Date().toISOString()
    };
    return this.http.put<usuario>(`${this.url}/${usuario.id}`, usuarioActualizado);
  }

  actualizarActividad(id: string | number): Observable<usuario> {
    return this.http.patch<usuario>(`${this.url}/${id}`, {
      ultimaActividad: new Date().toISOString()
    });
  }

  // RF03 - Cerrar sesión
  cerrarSesion(): void {
    const usuario = this.obtenerUsuarioActual();
    if (usuario && usuario.id) {
      this.actualizarActividad(usuario.id).subscribe();
    }
    localStorage.removeItem('usuarioLogueado');
  }

  // RF01 - Verificar si está logueado
  estaLogueado(): boolean {
    return !!localStorage.getItem('usuarioLogueado');
  }

  obtenerUsuarioActual(): usuario | null {
    const data = localStorage.getItem('usuarioLogueado');
    return data ? JSON.parse(data) : null;
  }

  esAdmin(): boolean {
    const usuario = this.obtenerUsuarioActual();
    return usuario?.rol === 'admin';
  }

  esCliente(): boolean {
    const usuario = this.obtenerUsuarioActual();
    return usuario?.rol === 'usuario';
  }

  // RF27 - Eliminar clientes con 1 año de inactividad
  verificarInactividad(): Observable<usuario[]> {
    return this.http.get<usuario[]>(this.url);
  }

  desactivarUsuario(id: string): Observable<usuario> {
    return this.http.patch<usuario>(`${this.url}/${id}`, { activo: false });
  }

  eliminarUsuario(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}

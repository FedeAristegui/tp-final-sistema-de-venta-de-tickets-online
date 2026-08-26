import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { usuario } from  '../modelos/usuario';
import { coincideCon } from './filtro-backend';

@Injectable({
  providedIn: 'root',
})
export class Autenticador {
  private readonly http = inject(HttpClient);
  private url = 'http://localhost:3000/usuarios';

 
  buscarPorCredenciales(email: string, contrasena: string): Observable<usuario[]> {
    return this.http.get<usuario[]>(`${this.url}?email=${email}&contrasena=${contrasena}`);
  }

  buscarPorEmail(email: string): Observable<usuario[]> {
    return this.obtenerUsuarios().pipe(
      map(usuarios => (usuarios ?? []).filter(u => coincideCon(u, { email })))
    );
  }

  
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

  
  cerrarSesion(): void {
    const usuario = this.obtenerUsuarioActual();
    if (usuario && usuario.id) {
      this.actualizarActividad(usuario.id).subscribe();
    }
    localStorage.removeItem('usuarioLogueado');
  }

  
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

  
  verificarInactividad(): Observable<usuario[]> {
    return this.http.get<usuario[]>(this.url);
  }

  desactivarUsuario(id: string): Observable<usuario> {
    return this.http.patch<usuario>(`${this.url}/${id}`, { activo: false });
  }

  eliminarUsuario(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  // Guarda el código de recuperación y su vencimiento (15 minutos) para el usuario.
  guardarCodigoRecuperacion(id: string | number, resetCode: string): Observable<usuario> {
    const resetCodeExpira = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    return this.http.patch<usuario>(`${this.url}/${id}`, { resetCode, resetCodeExpira });
  }

  validarCodigoRecuperacion(usuario: usuario, codigo: string): boolean {
    if (!usuario.resetCode || !usuario.resetCodeExpira) return false;
    if (usuario.resetCode !== codigo) return false;
    return new Date(usuario.resetCodeExpira).getTime() > Date.now();
  }

  restablecerContrasena(id: string | number, nuevaContrasena: string): Observable<usuario> {
    return this.http.patch<usuario>(`${this.url}/${id}`, {
      contrasena: nuevaContrasena,
      resetCode: null,
      resetCodeExpira: null
    });
  }
}

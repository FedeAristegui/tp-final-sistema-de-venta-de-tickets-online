import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { usuario } from './usuario';

@Injectable({
  providedIn: 'root',
})
export class Autenticador {
  private url = 'http://localhost:3000/usuarios';

  constructor(private http: HttpClient) {}

  registrarUsuario(usuario: usuario) {
    return this.http.post(this.url, usuario);
  }

  obtenerUsuarios() {
    return this.http.get<usuario[]>(this.url);
  }
}

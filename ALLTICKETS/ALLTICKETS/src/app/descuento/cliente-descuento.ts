import { inject, Injectable } from '@angular/core';
import { Descuento } from '../modelos/descuento';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ClienteDescuento {

  private readonly http = inject(HttpClient);

  private readonly baseUrl = 'http://localhost:3000/descuentos';//URL DEL JSON SERVER
  
  obtenerDescuentos(): Observable<Descuento[]>{
    return this.http.get<Descuento[]>(this.baseUrl);
  }
  obtenerDescuentosId(id: string | number){
    return this.http.get<Descuento>(`${this.baseUrl}/${id}`);
  }
  agregarDescuento(descuento:Descuento){
    return this.http.post<Descuento>(this.baseUrl, descuento);
  }
  actualizarDescuento(descuento: Descuento, id:string|number){
    return this.http.put<Descuento>(`${this.baseUrl}/${id}`, descuento);
  }
  eliminarDescuento(id: string | number){
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
  
}

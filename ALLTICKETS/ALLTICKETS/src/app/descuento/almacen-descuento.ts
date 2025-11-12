import { Injectable, signal } from '@angular/core';
import { Descuento } from '../modelos/descuento';

@Injectable({
  providedIn: 'root',
})
export class AlmacenDescuento {

  private readonly descuento = signal<Descuento[]>([]);

  getDescuentos(){
    return this.descuento.asReadonly();
  }

  addMovie(descuento: Descuento){
    this.descuento.update((descuentos) => [...descuentos, descuento]);//Los 3 puntitos son para que se cree un arreglo nuevo con todos los elementos, sino me crea un arreglo con un arreglo de peliculas y una pelicula suelta
  }
  
}

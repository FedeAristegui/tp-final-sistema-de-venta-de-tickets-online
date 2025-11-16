import { Injectable, signal } from '@angular/core';
import { Evento } from '../modelos/evento';

export interface ItemCarrito {
  evento: Evento;
  cantidad: number;
  tipoEntrada: 'sector' | 'butaca';
  detalleEntrada: string;
  precioUnitario: number;
}

@Injectable({
  providedIn: 'root',
})
export class CarritoServicio {
  private itemsCarrito = signal<ItemCarrito[]>([]);
  
  constructor() {
    this.cargarCarritoDesdeLocalStorage();
  }

  obtenerItems() {
    return this.itemsCarrito.asReadonly();
  }

  agregarAlCarrito(item: ItemCarrito): void {
    const items = this.itemsCarrito();

    const indiceExistente = items.findIndex(
      i => i.evento.id === item.evento.id && 
           i.detalleEntrada === item.detalleEntrada
    );

    if (indiceExistente !== -1) {
      const nuevosItems = [...items];
      nuevosItems[indiceExistente].cantidad += item.cantidad;
      this.itemsCarrito.set(nuevosItems);
    } else {
      this.itemsCarrito.set([...items, item]);
    }

    this.guardarCarritoEnLocalStorage();
  }

  eliminarDelCarrito(index: number): void {
    const items = this.itemsCarrito();
    this.itemsCarrito.set(items.filter((_, i) => i !== index));
    this.guardarCarritoEnLocalStorage();
  }

  actualizarCantidad(index: number, cantidad: number): void {
    if (cantidad <= 0) {
      this.eliminarDelCarrito(index);
      return;
    }

    const items = this.itemsCarrito();
    const nuevosItems = [...items];
    nuevosItems[index].cantidad = cantidad;
    this.itemsCarrito.set(nuevosItems);
    this.guardarCarritoEnLocalStorage();
  }

  vaciarCarrito(): void {
    this.itemsCarrito.set([]);
    this.guardarCarritoEnLocalStorage();
  }

  calcularTotal(): number {
    return this.itemsCarrito().reduce(
      (total, item) => total + (item.precioUnitario * item.cantidad),
      0
    );
  }

  obtenerCantidadTotal(): number {
    return this.itemsCarrito().reduce(
      (total, item) => total + item.cantidad,
      0
    );
  }

  private guardarCarritoEnLocalStorage(): void {
    localStorage.setItem('carrito', JSON.stringify(this.itemsCarrito()));
  }

  private cargarCarritoDesdeLocalStorage(): void {
    const carritoGuardado = localStorage.getItem('carrito');
    if (carritoGuardado) {
      try {
        const items = JSON.parse(carritoGuardado);
        this.itemsCarrito.set(items);
      } catch (error) {
        console.error('Error al cargar el carrito:', error);
        this.itemsCarrito.set([]);
      }
    }
  }
}

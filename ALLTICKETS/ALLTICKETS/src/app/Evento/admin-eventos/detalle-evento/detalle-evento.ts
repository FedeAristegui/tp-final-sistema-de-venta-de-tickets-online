import { Component, OnInit, inject, ChangeDetectorRef, linkedSignal, signal} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EventoServicio } from '../../../servicios/evento.servicio';
import { CarritoServicio } from '../../../servicios/carrito.servicio';
import { Evento } from '../../../modelos/evento';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { AdminEventos } from "../crear-evento/admin-eventos";

@Component({
  selector: 'app-evento-ficha',
  imports: [DatePipe, RouterLink, AdminEventos, CommonModule, FormsModule],
  templateUrl: './detalle-evento.html',
  styleUrls: ['./detalle-evento.css']
})
export class detalleEvento {

  private readonly cliente = inject(EventoServicio);
  private readonly carritoServicio = inject(CarritoServicio);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly id = this.route.snapshot.paramMap.get('id');

  protected readonly eventoFuente = toSignal(this.cliente.obtenerEvento(this.id!));
  protected readonly evento = linkedSignal(() => this.eventoFuente());
  protected readonly isEditing = signal(false);
  
  // Variables para la compra
  protected cantidadSeleccionada = signal<number>(1);
  protected sectorSeleccionado = signal<string>('');
  protected butacaSeleccionada = signal<{ fila: string; numero: number; precio: number } | null>(null);

  toggleEdit(){
    this.isEditing.set(!this.isEditing());
  }

  handleEdit(evento: Evento){
    this.evento.set(evento);
    this.toggleEdit();

  }

  deleteMovie(){

    if(confirm('Desea borrar la pelicula?')){
      this.cliente.borrarEvento(this.id!).subscribe(() =>{
        alert('Pelicula borrada con exito');
        this.router.navigateByUrl('/cartelera');
      })
    }
  }

  // Agregar sector al carrito
  agregarSectorAlCarrito(sector: { nombre: string; capacidad: number; precio: number }): void {
    const evento = this.evento();
    if (!evento) return;

    const cantidad = this.cantidadSeleccionada();
    
    if (cantidad <= 0 || cantidad > sector.capacidad) {
      alert(`La cantidad debe estar entre 1 y ${sector.capacidad}`);
      return;
    }

    this.carritoServicio.agregarAlCarrito({
      evento: evento,
      cantidad: cantidad,
      tipoEntrada: 'sector',
      detalleEntrada: sector.nombre,
      precioUnitario: sector.precio
    });

    alert(`Se agregaron ${cantidad} entrada(s) para ${sector.nombre} al carrito`);
    this.cantidadSeleccionada.set(1);
  }

  // Agregar butaca al carrito
  agregarButacaAlCarrito(butaca: { fila: string; numero: number; precio: number; disponible: boolean }): void {
    const evento = this.evento();
    if (!evento) return;

    if (!butaca.disponible) {
      alert('Esta butaca no está disponible');
      return;
    }

    this.carritoServicio.agregarAlCarrito({
      evento: evento,
      cantidad: 1,
      tipoEntrada: 'butaca',
      detalleEntrada: `Fila ${butaca.fila} - Butaca ${butaca.numero}`,
      precioUnitario: butaca.precio
    });

    alert(`Butaca Fila ${butaca.fila} - Número ${butaca.numero} agregada al carrito`);
  }
  
}

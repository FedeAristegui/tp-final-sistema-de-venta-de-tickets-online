import { Component, OnInit, inject, ChangeDetectorRef, linkedSignal, signal} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EventoServicio } from '../../../servicios/evento.servicio';
import { Evento } from '../../../modelos/evento';
import { CommonModule, DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { AdminEventos } from "../crear-evento/admin-eventos";

@Component({
  selector: 'app-evento-ficha',
  imports: [DatePipe, RouterLink, AdminEventos],
  templateUrl: './detalle-evento.html',
  styleUrls: ['./detalle-evento.css']
})
export class detalleEvento {

  private readonly cliente = inject(EventoServicio);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly id = this.route.snapshot.paramMap.get('id');

  protected readonly eventoFuente = toSignal(this.cliente.obtenerEvento(this.id!));
  protected readonly evento = linkedSignal(() => this.eventoFuente());
  protected readonly isEditing = signal(false);

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
  
}

import { Component, OnInit } from '@angular/core';
import {  EventoServicio } from '../servicios/evento.servicio';
import { Evento } from '../models/evento';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-eventos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-eventos.html',
  styleUrls: ['./admin-eventos.css']
})
export class AdminEventos implements OnInit {
  eventos: Evento[] = [];
  eventoSeleccionado: Evento | null = null;
  nuevoEvento: Evento = {
    titulo: '',
    fecha: '',
    hora: '',
    imagen: '',
    modoVenta: 'sector',
    sectores: [],
    butacas: []
  };
  modoEdicion: boolean = false;  // para diferenciar crear vs editar

  constructor(private eventoService: EventoServicio) {}

  ngOnInit() {
    this.cargarEventos();
  }

  cargarEventos() {
    this.eventoService.obtenerEventos().subscribe(lista => {
      this.eventos = lista;
    });
  }

  iniciarCreacion() {
    this.nuevoEvento = {
      titulo: '',
      fecha: '',
      hora: '',
      imagen: '',
      modoVenta: 'sector',
      sectores: [],
      butacas: []
    };
    this.modoEdicion = false;
    this.eventoSeleccionado = null;
  }

  seleccionarEvento(evento: Evento) {
    this.eventoSeleccionado = evento;
    this.nuevoEvento = { ...evento };  // copia para editar
    this.modoEdicion = true;
  }

  guardarEvento(form: NgForm) {
    if (this.modoEdicion && this.nuevoEvento.id) {
      this.eventoService.actualizarEvento(this.nuevoEvento).subscribe({
        next: (res) => {
          // Actualizo la lista local con la respuesta del servidor
          const idx = this.eventos.findIndex(e => e.id === (res as Evento).id || e.id === this.nuevoEvento.id);
          if (idx >= 0) this.eventos[idx] = { ...(res as Evento) };
          alert('Evento actualizado.');
          this.iniciarCreacion();
          form.resetForm();
          this.cargarEventos();
        },
        error: () => {
          alert('Error actualizando evento. Intentá nuevamente.');
          this.cargarEventos(); // restaurar desde server
        }
      });
    } else {
      this.eventoService.crearEvento(this.nuevoEvento).subscribe({
        next: (res) => {
          // Agrego el nuevo evento a la lista local (server debería devolver el evento con id)
          this.eventos.push(res as Evento);
          alert('Evento creado.');
          this.iniciarCreacion();
          form.resetForm();
          this.cargarEventos();
        },
        error: () => {
          alert('Error creando evento. Intentá nuevamente.');
        }
      });
    }
  }

  eliminarEvento(id: number | undefined) {
    if (!id) return;
    if (confirm('¿Está seguro que desea eliminar este evento?')) {
      // Remuevo optimísticamente de la UI
      const antes = [...this.eventos];
      this.eventos = this.eventos.filter(e => e.id !== id);

      this.eventoService.borrarEvento(id).subscribe({
        next: () => {
          alert('Evento eliminado.');
        },
        error: () => {
          alert('Error al eliminar. Restaurando lista.');
          this.eventos = antes; // restaurar si falló
          this.cargarEventos();
        }
      });
    }
  }

  cambiarModoVenta() {
    if (this.nuevoEvento.modoVenta === 'sector') {
      this.nuevoEvento.butacas = [];
    } else {
      this.nuevoEvento.sectores = [];
    }
  }

  // Métodos para agregar sectores / butacas como ejemplo
  agregarSector() {
    this.nuevoEvento.sectores!.push({ nombre: '', capacidad: 0, precio: 0 });
  }
  agregarButaca() {
    this.nuevoEvento.butacas!.push({ fila: '', numero: 0, precio: 0, disponible: true });
  }
}

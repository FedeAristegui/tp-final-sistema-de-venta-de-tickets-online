import { Component, OnInit, inject, ChangeDetectorRef} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EventoServicio } from '../servicios/evento.servicio';
import { Evento } from '../models/evento';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-evento-ficha',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './detalle-evento.html',
  styleUrls: ['./detalle-evento.css']
})
export class detalleEvento implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly eventoService = inject(EventoServicio);
  private readonly cdr = inject(ChangeDetectorRef);

  evento: Evento | null = null;
  error = '';

  ngOnInit(): void {
  const idParam = this.route.snapshot.params['id'] || this.route.snapshot.paramMap.get('id');
  if (!idParam) {
    this.error = 'ID de evento no proporcionado en la URL.';
    return;
  }
  const id = (idParam);
  console.log('ID recibido:', id); // Verifica el ID


  this.eventoService.obtenerEvento(id).subscribe({
    // ...en detalle-evento.ts
next: (res) => {
  console.log('Respuesta de obtenerEvento:', res);
  // Si la respuesta es un array, toma el primero
  if (Array.isArray(res)) {
    this.evento = res[0] ?? null;
  } else {
    this.evento = res;
  }
  if (!this.evento) {
    this.error = 'Evento no encontrado.';
  }

    },
    error: (err) => {
      console.error('Error al obtener evento:', err);
      this.error = 'Error al obtener el evento desde el servidor.';
    }
  });
}}

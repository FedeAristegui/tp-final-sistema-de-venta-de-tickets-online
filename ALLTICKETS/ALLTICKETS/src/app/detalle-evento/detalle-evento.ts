import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EventoServicio } from '../servicios/evento.servicio';
import { Evento } from '../models/evento';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-evento-ficha',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalle-evento.html',
  styleUrls: ['./detalle-evento.css']
})
export class detalleEvento implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly eventoService = inject(EventoServicio);

  evento: Evento | null = null;
  error = '';

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = Number(idParam);
    if (isNaN(id)) {
      this.error = 'ID de evento inválido.';
      return;
    }
    this.eventoService.obtenerEvento(id).subscribe({
      next: (res) => {
        console.log('obtenerEvento response:', res);
        // si el servicio devuelve un array (p. ej. buscar/filter), manejarlo
        if (Array.isArray(res)) {
          this.evento = res.find((x: any) => Number(x.id) === id) ?? null;
        } else {
          this.evento = res as Evento;
        }

        if (!this.evento) {
          this.error = 'Evento no encontrado (respuesta válida pero sin datos).';
          console.warn('Evento no encontrado en la respuesta para id=', id);
        }
      },
      error: (err) => {
        console.error('Error al obtener evento:', err);
        this.error = 'Error al obtener el evento desde el servidor.';
      }
    });
  }
}

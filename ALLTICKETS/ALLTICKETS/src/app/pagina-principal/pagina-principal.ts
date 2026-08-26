import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { EventoServicio } from '../servicios/evento.servicio';
import { FavoritoServicio } from '../servicios/favorito.servicio';
import { ModalConfirmacionService } from '../servicios/modal-confirmacion.service';
import { Evento } from '../modelos/evento';
import { Favorito } from '../modelos/favorito';
import { Icono } from '../ui/icono';

@Component({
  selector: 'app-pagina-principal',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, Icono],
  templateUrl: './pagina-principal.html',
  styleUrls: ['./pagina-principal.css']
})
export class PaginaPrincipal implements OnInit {
  usuario = signal<any>(null);
  eventos = signal<Evento[]>([]);
  eventosFiltrados = signal<Evento[]>([]);
  isLoading = signal(false);
  /**
   * Favoritos del usuario indexados por evento: `eventoId -> id del favorito`.
   * Se guarda también el id del favorito (y no sólo el del evento) porque es lo
   * que hace falta para borrarlo; antes había que pedir toda la colección de
   * favoritos cada vez que se desmarcaba un corazón.
   */
  favoritosUsuario = signal<Map<string, string>>(new Map());
  protected readonly categorias = ['Deportes', 'Música', 'Comedia', 'Teatro'];


  filtrosForm: FormGroup;

  private readonly eventoService = inject(EventoServicio);
  private readonly favoritoService = inject(FavoritoServicio);
  private readonly modalService = inject(ModalConfirmacionService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);


  constructor() {

    this.filtrosForm = this.fb.group({
      nombre: [''],
      fecha: [''],
      categoria: ['']
    });


    this.filtrosForm.valueChanges.subscribe(() => {
      this.aplicarFiltros();
    });
  }

  ngOnInit() {
    const data = localStorage.getItem('usuarioLogueado');
    this.usuario.set(data ? JSON.parse(data) : null);
    this.cargarEventos();

    if (this.usuario()) {
      this.cargarFavoritos();
    }
  }

  cargarEventos(): void {
    this.isLoading.set(true);
    this.eventos.set([]);

    this.eventoService.obtenerEventos().subscribe({
      next: (eventos) => {
        const ahora = new Date();
        const eventosFuturos = eventos.filter(evento => new Date(`${evento.fecha}T${evento.hora}`) >= ahora);
        this.eventos.set(eventosFuturos);
        this.eventosFiltrados.set(eventosFuturos);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.eventos.set([]);
        this.eventosFiltrados.set([]);
        this.isLoading.set(false);
        this.modalService.notify('No se pudieron cargar los eventos. Intenta nuevamente en unos minutos.');
      }
    });
  }

  aplicarFiltros(): void {
    const filtros = this.filtrosForm.value;

    this.eventosFiltrados.set(this.eventos().filter(evento => {
      // Filtro por nombre/título
      const cumpleNombre = !filtros.nombre ||
        evento.titulo.toLowerCase().includes(filtros.nombre.toLowerCase()) ||
        evento.lugar.toLowerCase().includes(filtros.nombre.toLowerCase());

      // Filtro por fecha
      const cumpleFecha = !filtros.fecha || evento.fecha === filtros.fecha;

      // Filtro por categoría
      const cumpleCategoria = !filtros.categoria || evento.categoria === filtros.categoria;

      return cumpleNombre && cumpleFecha && cumpleCategoria;
    }));
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset({
      nombre: '',
      fecha: '',
      categoria: ''
    });
    this.eventosFiltrados.set(this.eventos());
  }

  cargarFavoritos(): void {
    if (!this.usuario()) return;

    this.favoritoService.obtenerFavoritosPorUsuario(this.usuario().id).subscribe({
      next: (favoritos) => {
        this.favoritosUsuario.set(this.indexarFavoritos(favoritos));
      },
      error: (err) => {
        this.favoritosUsuario.set(new Map());
        this.modalService.notify('No se pudieron cargar tus favoritos. Intenta nuevamente en unos minutos.');
      }
    });
  }

  private indexarFavoritos(favoritos: Favorito[]): Map<string, string> {
    const indice = new Map<string, string>();
    favoritos.forEach(f => {
      if (f.id) indice.set(String(f.eventoId), f.id);
    });
    return indice;
  }

  esFavorito(eventoId: number | undefined): boolean {
    if (!eventoId) return false;
    return this.favoritosUsuario().has(String(eventoId));
  }

  async toggleFavorito(evento: Evento, event: Event): Promise<void> {
    event.stopPropagation(); // Evitar que se active el click del evento

    if (!this.usuario()) {
      await this.modalService.notify('Debes iniciar sesión para agregar favoritos');
      this.router.navigate(['/login']);
      return;
    }

    if (!evento.id) return;

    const eventoId = String(evento.id);
    const favoritoId = this.favoritosUsuario().get(eventoId);

    if (favoritoId) {
      // Eliminar de favoritos: el id ya lo teníamos en memoria.
      this.favoritoService.eliminarFavorito(favoritoId).subscribe({
        next: () => {
          this.favoritosUsuario.update(favs => {
            const copia = new Map(favs);
            copia.delete(eventoId);
            return copia;
          });
        },
        error: (err) => {
          this.modalService.notify('No se pudo quitar el favorito. Intenta nuevamente en unos minutos.');
        }
      });
    } else {
      // Agregar a favoritos
      const nuevoFavorito: Favorito = {
        usuarioId: this.usuario().id,
        eventoId: eventoId,
        fechaAgregado: new Date().toISOString()
      };

      this.favoritoService.agregarFavorito(nuevoFavorito).subscribe({
        next: (creado) => {
          if (!creado.id) return;
          this.favoritosUsuario.update(favs => new Map(favs).set(eventoId, creado.id!));
        },
        error: (err) => {
          this.modalService.notify('No se pudo agregar el favorito. Intenta nuevamente en unos minutos.');
        }
      });
    }
  }

  verDetalleEvento(id: number | undefined): void {
    if (id) {
      this.router.navigate(['/ficha-evento', id]);
    }
  }
}

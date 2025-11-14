import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { EventoServicio } from '../servicios/evento.servicio';
import { FavoritoServicio } from '../servicios/favorito.servicio';
import { Evento, CategoriaEvento } from '../modelos/evento';
import { Favorito } from '../modelos/favorito';

@Component({
  selector: 'app-pagina-principal',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './pagina-principal.html',
  styleUrls: ['./pagina-principal.css']
})
export class PaginaPrincipal implements OnInit {
  usuario: any = null;
  eventos: Evento[] = [];
  eventosFiltrados: Evento[] = [];
  isLoading = true;
  favoritosUsuario: string[] = []; // IDs de eventos favoritos del usuario

  // Formulario de filtros
  filtrosForm: FormGroup;
  
  // Categorías fijas
  readonly categorias: CategoriaEvento[] = ['Deportes', 'Música', 'Comedia'];

  private readonly eventoService = inject(EventoServicio);
  private readonly favoritoService = inject(FavoritoServicio);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder);

  constructor() {
    // Inicializar formulario reactivo
    this.filtrosForm = this.fb.group({
      nombre: [''],
      fecha: [''],
      categoria: ['']
    });

    // Escuchar cambios en el formulario
    this.filtrosForm.valueChanges.subscribe(() => {
      this.aplicarFiltros();
    });
  }

  ngOnInit() {
    const data = localStorage.getItem('usuarioLogueado');
    this.usuario = data ? JSON.parse(data) : null;
    console.log('[PaginaPrincipal] ngOnInit - usuario:', this.usuario);
    this.cargarEventos();
    
    // Cargar favoritos si hay usuario logueado
    if (this.usuario) {
      this.cargarFavoritos();
    }
  }


  cargarEventos(): void {
    this.isLoading = true;
    this.eventos = [];
    
    this.eventoService.obtenerEventos().subscribe({
      next: (eventos) => {
        this.eventos = eventos;
        this.eventosFiltrados = eventos;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.eventos = [];
        this.eventosFiltrados = [];
        this.isLoading = false;
        alert('Error al cargar eventos. Asegúrate de que json-server esté corriendo en http://localhost:3000');
      },
      complete: () => {
        console.log('[PaginaPrincipal] Petición completada. isLoading:', this.isLoading, 'eventos.length:', this.eventos.length);
      }
    });
    
    setTimeout(() => {
      if (this.isLoading) {
        console.warn('[PaginaPrincipal] ⚠️ Timeout: La petición está tomando demasiado tiempo');
        this.isLoading = false;
      }
    }, 10000);
  }

  aplicarFiltros(): void {
    const filtros = this.filtrosForm.value;
    
    this.eventosFiltrados = this.eventos.filter(evento => {
      // Filtro por nombre/título
      const cumpleNombre = !filtros.nombre || 
        evento.titulo.toLowerCase().includes(filtros.nombre.toLowerCase()) ||
        evento.lugar.toLowerCase().includes(filtros.nombre.toLowerCase());

      // Filtro por fecha
      const cumpleFecha = !filtros.fecha || evento.fecha === filtros.fecha;

      // Filtro por categoría
      const cumpleCategoria = !filtros.categoria || evento.categoria === filtros.categoria;

      return cumpleNombre && cumpleFecha && cumpleCategoria;
    });
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset({
      nombre: '',
      fecha: '',
      categoria: ''
    });
    this.eventosFiltrados = this.eventos;
  }

  cargarFavoritos(): void {
    if (!this.usuario) return;
    
    this.favoritoService.obtenerFavoritosPorUsuario(this.usuario.id).subscribe({
      next: (favoritos) => {
        this.favoritosUsuario = favoritos.map(f => String(f.eventoId));
        console.log('[PaginaPrincipal] Favoritos cargados:', this.favoritosUsuario);
      },
      error: (err) => {
        console.error('Error al cargar favoritos:', err);
        this.favoritosUsuario = [];
      }
    });
  }

  esFavorito(eventoId: number | undefined): boolean {
    if (!eventoId) return false;
    return this.favoritosUsuario.includes(String(eventoId));
  }

  toggleFavorito(evento: Evento, event: Event): void {
    event.stopPropagation(); // Evitar que se active el click del card
    
    if (!this.usuario) {
      alert('Debes iniciar sesión para agregar favoritos');
      this.router.navigate(['/login']);
      return;
    }

    if (!evento.id) return;

    const eventoId = String(evento.id);
    
    if (this.esFavorito(evento.id)) {
      // Quitar de favoritos
      this.favoritoService.verificarFavorito(this.usuario.id, eventoId).subscribe({
        next: (favoritos) => {
          if (favoritos.length > 0 && favoritos[0].id) {
            this.favoritoService.eliminarFavorito(favoritos[0].id).subscribe({
              next: () => {
                this.favoritosUsuario = this.favoritosUsuario.filter(id => id !== eventoId);
                this.cdr.detectChanges(); // Forzar actualización de vista
                console.log('Favorito eliminado');
              },
              error: (err) => console.error('Error al eliminar favorito:', err)
            });
          }
        }
      });
    } else {
      // Agregar a favoritos
      const nuevoFavorito: Favorito = {
        usuarioId: this.usuario.id,
        eventoId: eventoId,
        fechaAgregado: new Date().toISOString()
      };

      this.favoritoService.agregarFavorito(nuevoFavorito).subscribe({
        next: () => {
          this.favoritosUsuario.push(eventoId);
          this.cdr.detectChanges(); // Forzar actualización de vista
          console.log('Favorito agregado');
        },
        error: (err) => console.error('Error al agregar favorito:', err)
      });
    }
  }

  cerrarSesion() {
    localStorage.removeItem('usuarioLogueado');
    this.usuario = null;
    this.favoritosUsuario = [];
    this.router.navigate(['/']);
  }

  verDetalleEvento(id: number | undefined): void {
    if (id) {
      this.router.navigate(['/ficha-evento', id]);
    }
  }
}
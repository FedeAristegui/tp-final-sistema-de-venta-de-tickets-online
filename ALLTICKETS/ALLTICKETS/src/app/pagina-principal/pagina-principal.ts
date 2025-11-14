import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { EventoServicio } from '../servicios/evento.servicio';
import { Evento } from '../modelos/evento';

@Component({
  selector: 'app-pagina-principal',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './pagina-principal.html',
  styleUrls: ['./pagina-principal.css']
})
export class PaginaPrincipal implements OnInit {
  usuario: any = null;
  eventos: Evento[] = [];
  isLoading = true;

  private readonly eventoService = inject(EventoServicio);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    const data = localStorage.getItem('usuarioLogueado');
    this.usuario = data ? JSON.parse(data) : null;
    console.log('[PaginaPrincipal] ngOnInit - usuario:', this.usuario);
    this.cargarEventos();
  }


  cargarEventos(): void {
    this.isLoading = true;
    this.eventos = [];
    
    
    this.eventoService.obtenerEventos().subscribe({
      next: (eventos) => {
        
        this.eventos = eventos;
        this.isLoading = false;
        this.cdr.detectChanges(); // Forzar detección de cambios
      },
      error: (err) => {
        
        this.eventos = [];
        this.isLoading = false;
        
        // Mostrar mensaje de error al usuario
        alert('Error al cargar eventos. Asegúrate de que json-server esté corriendo en http://localhost:3000');
      },
      complete: () => {
        console.log('[PaginaPrincipal] Petición completada. isLoading:', this.isLoading, 'eventos.length:', this.eventos.length);
      }
    });
    
    // Timeout de seguridad
    setTimeout(() => {
      if (this.isLoading) {
        console.warn('[PaginaPrincipal] ⚠️ Timeout: La petición está tomando demasiado tiempo');
        this.isLoading = false;
      }
    }, 10000);
  }

  cerrarSesion() {
    localStorage.removeItem('usuarioLogueado');
    this.usuario = null;
    this.router.navigate(['/']);
  }

  verDetalleEvento(id: number | undefined): void {
    if (id) {
      this.router.navigate(['/ficha-evento', id]);
    }
  }
}
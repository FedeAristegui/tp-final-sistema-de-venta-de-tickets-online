import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VentaServicio } from '../servicios/venta.servicio';
import { ModalConfirmacionService } from '../servicios/modal-confirmacion.service';
import { EstadisticaEvento } from '../modelos/venta';

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './estadisticas.html',
  styleUrls: ['./estadisticas.css']
})
export class Estadisticas implements OnInit {
  
  private readonly ventaService = inject(VentaServicio);
  private readonly modalService = inject(ModalConfirmacionService);
  
  protected estadisticas = signal<EstadisticaEvento[]>([]);
  protected isLoading = signal(false);
  protected totalEntradasVendidas = signal(0);
  protected totalRecaudadoGeneral = signal(0);
  protected promedioOcupacion = signal(0);
  protected busqueda = signal('');

  // Detalle por evento: del más reciente al más viejo, filtrable por título.
  // Se separa del ranking (que se ordena por ventas) para no alterar ese orden.
  protected estadisticasTabla = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    return this.estadisticas()
      .filter(e => !texto || e.eventoTitulo.toLowerCase().includes(texto))
      .sort((a, b) => new Date(b.eventoFecha).getTime() - new Date(a.eventoFecha).getTime());
  });

  ngOnInit(): void {
    this.cargarEstadisticas();
  }

  cargarEstadisticas(): void {
    this.isLoading.set(true);
    
    this.ventaService.obtenerEstadisticas().subscribe({
      next: (stats) => {
        this.estadisticas.set(stats.sort((a, b) => b.totalVendidas - a.totalVendidas));
        this.calcularTotales();
        this.isLoading.set(false);
      },
      error: (err) => {
        this.estadisticas.set([]);
        this.totalEntradasVendidas.set(0);
        this.totalRecaudadoGeneral.set(0);
        this.promedioOcupacion.set(0);
        this.isLoading.set(false);
        
        if (err.status === 0) {
          this.modalService.notify('No se pudo conectar con el servidor. Intenta nuevamente en unos minutos.');
        } else {
          this.modalService.notify('No se pudieron cargar las estadísticas. Intenta nuevamente más tarde.');
        }
      }
    });
  }

  calcularTotales(): void {
    const stats = this.estadisticas();
    this.totalEntradasVendidas.set(stats.reduce((sum, e) => sum + e.totalVendidas, 0));
    this.totalRecaudadoGeneral.set(stats.reduce((sum, e) => sum + e.totalRecaudado, 0));
    
    if (stats.length > 0) {
      this.promedioOcupacion.set(stats.reduce((sum, e) => sum + e.porcentajeOcupacion, 0) / stats.length);
    }
  }

  getColorPorcentaje(porcentaje: number): string {
    if (porcentaje >= 80) return '#4caf50'; // Verde
    if (porcentaje >= 50) return '#ffc107'; // Amarillo
    if (porcentaje >= 25) return '#ff9800'; // Naranja
    return '#f44336'; // Rojo
  }
}
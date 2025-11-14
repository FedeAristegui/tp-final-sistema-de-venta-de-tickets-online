import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { VentaServicio } from '../servicios/venta.servicio';
import { EstadisticaEvento } from '../modelos/venta';

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './estadisticas.html',
  styleUrls: ['./estadisticas.css']
})
export class Estadisticas implements OnInit {
  
  private readonly ventaService = inject(VentaServicio);
  
  protected estadisticas: EstadisticaEvento[] = [];
  protected isLoading = true;
  protected totalEntradasVendidas = 0;
  protected totalRecaudadoGeneral = 0;
  protected promedioOcupacion = 0;

  ngOnInit(): void {
    this.cargarEstadisticas();
  }

  cargarEstadisticas(): void {
    this.isLoading = true;
    console.log('Cargando estadísticas...');
    
    this.ventaService.obtenerEstadisticas().subscribe({
      next: (stats) => {
        console.log('Estadísticas recibidas:', stats);
        this.estadisticas = stats.sort((a, b) => b.totalVendidas - a.totalVendidas);
        this.calcularTotales();
        this.isLoading = false;
        console.log('Carga completada');
      },
      error: (err) => {
        console.error('Error completo:', err);
        this.estadisticas = [];
        this.totalEntradasVendidas = 0;
        this.totalRecaudadoGeneral = 0;
        this.promedioOcupacion = 0;
        this.isLoading = false;
        
        if (err.status === 0) {
          alert('⚠️ No se puede conectar al servidor.\n\nAsegúrate de ejecutar:\njson-server --watch db.json');
        } else {
          alert('Error al cargar las estadísticas: ' + (err.message || 'Error desconocido'));
        }
      }
    });
  }

  calcularTotales(): void {
    this.totalEntradasVendidas = this.estadisticas.reduce((sum, e) => sum + e.totalVendidas, 0);
    this.totalRecaudadoGeneral = this.estadisticas.reduce((sum, e) => sum + e.totalRecaudado, 0);
    
    if (this.estadisticas.length > 0) {
      this.promedioOcupacion = this.estadisticas.reduce((sum, e) => sum + e.porcentajeOcupacion, 0) / this.estadisticas.length;
    }
  }

  getColorPorcentaje(porcentaje: number): string {
    if (porcentaje >= 80) return '#4caf50'; // Verde
    if (porcentaje >= 50) return '#ffc107'; // Amarillo
    if (porcentaje >= 25) return '#ff9800'; // Naranja
    return '#f44336'; // Rojo
  }
}

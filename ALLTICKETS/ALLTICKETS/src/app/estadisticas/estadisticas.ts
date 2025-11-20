import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { VentaServicio } from '../servicios/venta.servicio';
import { EstadisticaEvento } from '../modelos/venta';

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './estadisticas.html',
  styleUrls: ['./estadisticas.css']
})
export class Estadisticas implements OnInit {
  
  private readonly ventaService = inject(VentaServicio);
  
  protected estadisticas = signal<EstadisticaEvento[]>([]);
  protected isLoading = signal(false);
  protected totalEntradasVendidas = signal(0);
  protected totalRecaudadoGeneral = signal(0);
  protected promedioOcupacion = signal(0);

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
          alert('No se puede conectar al servidor.\n\nAsegúrate de ejecutar:\njson-server --watch db.json');
        } else {
          alert('Error al cargar las estadísticas: ' + (err.message || 'Error desconocido'));
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
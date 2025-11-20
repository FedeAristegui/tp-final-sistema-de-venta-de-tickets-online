import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { VentaServicio } from '../servicios/venta.servicio';
import { Venta } from '../modelos/venta';

@Component({
  selector: 'app-historial-compras',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './historial-compras.html',
  styleUrls: ['./historial-compras.css']
})
export class HistorialCompras implements OnInit {
  private ventaService = inject(VentaServicio);
  
  compras = signal<Venta[]>([]);
  cargando = signal(true);
  
  ngOnInit() {
    const usuarioData = localStorage.getItem('usuarioLogueado');
    if (usuarioData) {
      const usuario = JSON.parse(usuarioData);
      this.ventaService.obtenerVentasPorUsuario(usuario.id).subscribe({
        next: (ventas) => {
          const ventasOrdenadas = ventas.sort((a,b) => {
            return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
          })
          this.compras.set(ventasOrdenadas);
          this.cargando.set(false);
        },
        error: (err) => {
        
          this.cargando.set(false);
        }
      });
    }
  }
}
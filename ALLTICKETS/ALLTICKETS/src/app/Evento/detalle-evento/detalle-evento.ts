import { Component, inject, linkedSignal, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EventoServicio } from '../../servicios/evento.servicio';
import { CarritoServicio } from '../../servicios/carrito.servicio';
import { Evento } from '../../modelos/evento';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Autenticador } from '../../servicios/autenticador';
import { AdminEventos } from '../crear-evento/admin-eventos';

@Component({
  selector: 'app-evento-ficha',
  imports: [DatePipe, CommonModule, FormsModule, AdminEventos],
  templateUrl: './detalle-evento.html',
  styleUrls: ['./detalle-evento.css']
})
export class detalleEvento {

  private readonly cliente = inject(EventoServicio);
  private readonly carritoServicio = inject(CarritoServicio);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly id = this.route.snapshot.paramMap.get('id');
  private readonly autenticador = inject(Autenticador);

  protected readonly eventoFuente = toSignal(this.cliente.obtenerEvento(this.id!));
  protected readonly evento = linkedSignal(() => this.eventoFuente());
  protected readonly isEditing = signal(false);
  protected readonly usuario = signal(this.autenticador.obtenerUsuarioActual());

  
  protected butacasSeleccionadas = signal<{ fila: string; numero: number }[]>([]);

  // Butacas agrupadas por fila
  protected butacasPorFila = computed(() => {
    const evento = this.evento();
    if (!evento?.butacas) return {};

    const agrupadas: { [fila: string]: any[] } = {};
    
    evento.butacas.forEach(butaca => {
      if (!agrupadas[butaca.fila]) {
        agrupadas[butaca.fila] = [];
      }
      agrupadas[butaca.fila].push(butaca);
    });

    Object.keys(agrupadas).forEach(fila => {
      agrupadas[fila].sort((a, b) => a.numero - b.numero);
    });

    return agrupadas;
  });

  protected filasOrdenadas = computed(() => {
    return Object.keys(this.butacasPorFila()).sort();
  });

  
  protected sectorSeleccionado = signal<string>('');
  protected cantidadSector = signal<number>(1);

  toggleEdit(){
    this.isEditing.set(!this.isEditing());
    setTimeout(() => {
    document.getElementById("form-edicion")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }, 50);
  }

  handleEdit(evento: Evento){
    this.evento.set(evento);
    this.toggleEdit();
  }

  // ====== MÉTODOS DE BUTACAS ======
  seleccionarButaca(fila: string, numero: number, disponible: boolean): void {
    if (!disponible) {
      alert('⚠️ Esta butaca no está disponible');
      return;
    }

    const butacas = this.butacasSeleccionadas();
    const index = butacas.findIndex(b => b.fila === fila && b.numero === numero);

    if (index >= 0) {
      this.butacasSeleccionadas.update(lista => 
        lista.filter(b => !(b.fila === fila && b.numero === numero))
      );
    } else {
      this.butacasSeleccionadas.update(lista => [...lista, { fila, numero }]);
    }
  }

  estaSeleccionada(fila: string, numero: number): boolean {
    return this.butacasSeleccionadas().some(b => b.fila === fila && b.numero === numero);
  }

  protected totalButacas = computed(() => {
    const evento = this.evento();
    if (!evento?.butacas) return 0;

    return this.butacasSeleccionadas().reduce((total, sel) => {
      const butaca = evento.butacas.find(b => b.fila === sel.fila && b.numero === sel.numero);
      return total + (butaca?.precio || 0);
    }, 0);
  });

  limpiarSeleccion(): void {
    this.butacasSeleccionadas.set([]);
  }

  // ====== MÉTODOS DE SECTORES ======
  getCapacidadDisponible(nombreSector: string): number {
    const evento = this.evento();
    const sector = evento?.sectores.find(s => s.nombre === nombreSector);
    return sector?.capacidad || 0;
  }

  seleccionarSector(nombreSector: string): void {
    this.sectorSeleccionado.set(nombreSector);
    this.cantidadSector.set(1);
  }

  aumentarCantidad(): void {
    const sector = this.evento()?.sectores.find(s => s.nombre === this.sectorSeleccionado());
    if (!sector) return;
    
    const disponible = this.getCapacidadDisponible(sector.nombre);
    if (this.cantidadSector() < disponible) {
        this.cantidadSector.update(c => c + 1);
    }
  }

  disminuirCantidad(): void {
    if (this.cantidadSector() > 1) {
      this.cantidadSector.update(c => c - 1);
    }
  }

  protected totalSector = computed(() => {
    const evento = this.evento();
    const sectorNombre = this.sectorSeleccionado();
    if (!evento || !sectorNombre) return 0;

    const sector = evento.sectores.find(s => s.nombre === sectorNombre);
    return (sector?.precio || 0) * this.cantidadSector();
  });

  // ====== AGREGAR AL CARRITO ======
  agregarAlCarrito(): void {
    const evento = this.evento();
    if (!evento) return;

    if (!this.usuario()) {
      alert('⚠️ Debes iniciar sesión para agregar al carrito');
      this.router.navigate(['/login']);
      return;
    }

    if (evento.modoVenta === 'butaca') {
      this.agregarButacasAlCarrito();
    } else {
      this.agregarSectorAlCarrito();
    }
  }

  private agregarButacasAlCarrito(): void {
    const butacas = this.butacasSeleccionadas();
    if (butacas.length === 0) {
      alert('⚠️ Debes seleccionar al menos una butaca');
      return;
    }

    const evento = this.evento()!;
    const itemsCarrito = this.carritoServicio.obtenerItems()();
    const butacasYaEnCarrito: string[] = [];
    const butacasAgregadas: string[] = [];
    
    butacas.forEach(sel => {
      const butaca = evento.butacas.find(b => b.fila === sel.fila && b.numero === sel.numero);
      if (butaca) {
        const detalleButaca = `Fila ${butaca.fila} - Butaca ${butaca.numero}`;
        
        // Verificar si esta butaca específica ya está en el carrito
        const yaExiste = itemsCarrito.some(item => 
          item.evento.id === evento.id && 
          item.detalleEntrada === detalleButaca
        );
        
        if (yaExiste) {
          butacasYaEnCarrito.push(detalleButaca);
        } else {
          this.carritoServicio.agregarAlCarrito({
            evento: evento,
            cantidad: 1,
            tipoEntrada: 'butaca',
            detalleEntrada: detalleButaca,
            precioUnitario: butaca.precio
          });
          butacasAgregadas.push(detalleButaca);
        }
      }
    });

    
    if (butacasAgregadas.length > 0 && butacasYaEnCarrito.length === 0) {
      alert(`✅ ${butacasAgregadas.length} butaca(s) agregada(s) al carrito`);
    } else if (butacasAgregadas.length > 0 && butacasYaEnCarrito.length > 0) {
      alert(`✅ ${butacasAgregadas.length} butaca(s) agregada(s) al carrito\n\n⚠️ ${butacasYaEnCarrito.length} butaca(s) ya estaba(n) en el carrito:\n${butacasYaEnCarrito.join('\n')}`);
    } else {
      alert(`⚠️ Todas las butacas seleccionadas ya están en el carrito:\n${butacasYaEnCarrito.join('\n')}`);
    }

    this.limpiarSeleccion();

    // Sincronizar carrito con servidor si hay usuario logueado
    const usuarioLocal = this.usuario();
    if (usuarioLocal && usuarioLocal.id) {
      try {
        this.carritoServicio.sincronizarConServidor(String(usuarioLocal.id)).subscribe({
          next: () => {},
          error: (err) => console.error('Error sincronizando carrito (butacas):', err)
        });
      } catch (e) {
        console.error('Error iniciando sincronización de carrito (butacas):', e);
      }
    }
  }

  private agregarSectorAlCarrito(): void {
    const sectorNombre = this.sectorSeleccionado();
    if (!sectorNombre) {
      alert('⚠️ Debes seleccionar un sector');
      return;
    }

    const evento = this.evento()!;
    const sector = evento.sectores.find(s => s.nombre === sectorNombre);
    if (!sector) return;

    const cantidad = this.cantidadSector();
    const disponible = this.getCapacidadDisponible(sector.nombre);

    if (cantidad > disponible) {
      alert(`⚠️ Solo hay ${disponible} entradas disponibles`);
      return;
    }

    this.carritoServicio.agregarAlCarrito({
      evento: evento,
      cantidad: cantidad,
      tipoEntrada: 'sector',
      detalleEntrada: sector.nombre,
      precioUnitario: sector.precio
    });

    alert(`✅ ${cantidad} entrada(s) para ${sector.nombre} agregada(s) al carrito`);
    this.sectorSeleccionado.set('');
    this.cantidadSector.set(1);

    
    const usuarioLocal = this.usuario();
    if (usuarioLocal && usuarioLocal.id) {
      try {
        this.carritoServicio.sincronizarConServidor(String(usuarioLocal.id)).subscribe({
          next: () => {},
          error: (err) => console.error('Error sincronizando carrito (sector):', err)
        });
      } catch (e) {
        console.error('Error iniciando sincronización de carrito (sector):', e);
      }
    }
  }

  

  volverAtras(): void {
    const usuario = this.usuario();
    if (usuario?.rol === 'admin') {
      this.router.navigate(['/lista-eventos']);
    } else {
      this.router.navigate(['/menu-principal']);
    }
  }
}

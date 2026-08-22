import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CarritoServicio, ItemCarrito } from '../servicios/carrito.servicio';
import { VentaServicio } from '../servicios/venta.servicio';
import { ClienteDescuento } from '../servicios/cliente-descuento';
import { TarjetaServicio } from '../servicios/tarjeta.servicio';
import { EventoServicio } from '../servicios/evento.servicio';
import { ModalConfirmacionService } from '../servicios/modal-confirmacion.service';
import { Venta } from '../modelos/venta';
import { Descuento } from '../modelos/descuento';
import { Tarjeta } from '../modelos/tarjeta';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { Evento } from '../modelos/evento';
import { tarjetaNoVencidaValidator } from '../mis-tarjetas/mis-tarjetas';

@Component({
  selector: 'app-carrito',
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
  templateUrl: './carrito.html',
  styleUrl: './carrito.css',
})
export class Carrito implements OnInit {
  private carritoServicio = inject(CarritoServicio);
  private ventaServicio = inject(VentaServicio);
  private descuentoServicio = inject(ClienteDescuento);
  private tarjetaServicio = inject(TarjetaServicio);
  private eventoServicio = inject(EventoServicio);
  private modalService = inject(ModalConfirmacionService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  
  items = this.carritoServicio.obtenerItems();
  subtotal = computed(() => this.carritoServicio.calcularTotal());
  cantidadTotal = computed(() => this.carritoServicio.obtenerCantidadTotal());

  // temporizador de reserva del carrito
  tiempoRestanteMs = this.carritoServicio.obtenerTiempoRestante();
  carritoExpirado = this.carritoServicio.obtenerCarritoExpirado();
  tiempoRestanteFormateado = computed(() => {
    const totalSegundos = Math.max(0, Math.floor(this.tiempoRestanteMs() / 1000));
    const minutos = Math.floor(totalSegundos / 60);
    const segundos = totalSegundos % 60;
    return `${minutos}:${segundos.toString().padStart(2, '0')}`;
  });
  tiempoRestanteCritico = computed(() => this.tiempoRestanteMs() <= 60000);

  mensaje: string = '';
  tipoMensaje: 'error' | 'success' | '' = '';
  
  procesandoCompra = signal<boolean>(false);
  compraExitosa = signal<boolean>(false);
  mensajeCompra = signal<string>('');
  detalleCompra = signal<{
    ventasProcesadas: number;
    totalPagado: number;
    descuentoAplicado: number;
    tarjetaUsada?: string;
  } | null>(null);
  
  // tarjetas
  usuario: any = null;
  tarjetasUsuario = signal<Tarjeta[]>([]);
  tarjetaSeleccionada = signal<Tarjeta | null>(null);
  mostrarFormularioTarjeta = signal<boolean>(false);
  tarjetaForm: FormGroup;
  
  // cupones
  codigoCupon = signal<string>('');
  cuponAplicado = signal<Descuento | null>(null);
  mensajeCupon = signal<string>('');
  cuponEsError = signal<boolean>(false);
  descuentoPorcentaje = computed(() => this.cuponAplicado()?.porcentaje || 0);
  montoDescuento = computed(() => this.subtotal() * (this.descuentoPorcentaje() / 100));
  total = computed(() => this.subtotal() - this.montoDescuento());

  // modal de confirmación
  showConfirmModal = signal<boolean>(false);
  confirmMessage = signal<string>('');
  pendingAction: 'eliminar' | 'vaciar' | 'pagar' | null = null;
  pendingItemIndex: number | null = null;

  constructor() {
    this.tarjetaForm = this.fb.group({
      numeroTarjeta: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
      titular: ['', [Validators.required, Validators.minLength(3)]],
      vencimiento: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/), tarjetaNoVencidaValidator]],
      cvv: ['', [Validators.required, Validators.pattern(/^\d{3}$/)]],
      tipo: ['Visa', Validators.required]
    });
  }

  ngOnInit(): void {
    const data = localStorage.getItem('usuarioLogueado');
    this.usuario = data ? JSON.parse(data) : null;

    if (this.usuario) {
      this.cargarTarjetasUsuario();
      this.cargarCarritoUsuario();
    }
  }

  cargarTarjetasUsuario(){
    this.tarjetaServicio.obtenerTarjetasPorUsuario(this.usuario.id).subscribe({
      next: (tarjetas) => {
        this.tarjetasUsuario.set(tarjetas);
        const principal = tarjetas.find(t => t.esPrincipal);
        if (principal) {
          this.tarjetaSeleccionada.set(principal);
        }
      },
      error: (err) => {
        this.tarjetasUsuario.set([]);
      }
    });
  }

  seleccionarTarjeta(tarjeta: Tarjeta){
    this.tarjetaSeleccionada.set(tarjeta);
    this.mostrarFormularioTarjeta.set(false);
  }

  toggleFormularioTarjeta(){
    this.mostrarFormularioTarjeta.update(v => !v);
    if (!this.mostrarFormularioTarjeta()) {
      this.tarjetaForm.reset({ tipo: 'Visa' });
    }
  }

  agregarNuevaTarjeta(){
    if (this.tarjetaForm.invalid) {
      this.tarjetaForm.markAllAsTouched();
      this.mensaje = 'Por favor completa todos los campos correctamente';
      this.tipoMensaje = 'error';
      return;
    }

    const formValue = this.tarjetaForm.value;
    const ultimosDigitos = formValue.numeroTarjeta.slice(-4);

    const nuevaTarjeta: Tarjeta = {
      usuarioId: this.usuario.id,
      numeroTarjeta: ultimosDigitos,
      titular: formValue.titular,
      vencimiento: formValue.vencimiento,
      tipo: formValue.tipo,
      esPrincipal: this.tarjetasUsuario().length === 0,
      fechaAgregada: new Date().toISOString()
    };

    this.tarjetaServicio.agregarTarjeta(nuevaTarjeta).subscribe({
      next: (tarjeta) => {
        this.tarjetasUsuario.update(tarjetas => [...tarjetas, tarjeta]);
        this.tarjetaSeleccionada.set(tarjeta);
        this.mostrarFormularioTarjeta.set(false);
        this.tarjetaForm.reset({ tipo: 'Visa' });
        this.mensaje = 'Tarjeta agregada correctamente';
        this.tipoMensaje = 'success';
      },
      error: (err) => {
        this.modalService.notify('No se pudo agregar la tarjeta. Intenta nuevamente en unos minutos.');
      }
    });
  }

  formatearNumeroTarjeta(numero: string){
    return `•••• •••• •••• ${numero}`;
  }

  obtenerIconoTarjeta(tipo: string){
    switch (tipo) {
      default: return '💳';
    }
  }

  eliminarItem(index: number){
    this.pendingItemIndex = index;
    this.pendingAction = 'eliminar';
    this.confirmMessage.set('¿Estás seguro de que deseas eliminar este item del carrito?');
    this.showConfirmModal.set(true);
  }

  private confirmarEliminarItem() {
    if (this.pendingItemIndex === null) return;
    
    const index = this.pendingItemIndex;
    const item = this.items()[index];
    
    // Si es una butaca, desmarcarla en la base de datos
    if (item && item.tipoEntrada === 'butaca') {
      const detalles = item.detalleEntrada.match(/Fila (\w+) - Butaca (\d+)/);
      if (detalles) {
        const fila = detalles[1];
        const numero = parseInt(detalles[2], 10);
        this.carritoServicio.desmarcarButacas(item.evento.id!, [{ fila, numero }]).subscribe({
          next: () => {
            // Butaca desmarcada exitosamente
          },
          error: (err) => {
            console.error('Error desmarcando butaca:', err);
          }
        });
      }
    }
    
    this.carritoServicio.eliminarDelCarrito(index);
    if (this.usuario) {
      this.carritoServicio.sincronizarConServidor(this.usuario.id).subscribe({
        next: () => {},
        error: (err) => {}
      });
    }
    
    this.closeConfirmModal();
  }

  actualizarCantidad(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const cantidad = parseInt(input.value, 10);
    
    if (cantidad > 0) {
      this.carritoServicio.actualizarCantidad(index, cantidad);
      if (this.usuario) {
        this.carritoServicio.sincronizarConServidor(this.usuario.id).subscribe({
          next: () => {},
          error: (err) => {}
        });
      }
    }
  }

  vaciarCarrito() {
    this.pendingAction = 'vaciar';
    this.confirmMessage.set('¿Estás seguro de que deseas vaciar el carrito?');
    this.showConfirmModal.set(true);
  }

  private confirmarVaciarCarrito() {
    // Desmarcar todas las butacas antes de vaciar (agrupadas por evento para no pisarse entre sí)
    const items = this.items();
    const butacasPorEvento = new Map<string | number, { fila: string; numero: number }[]>();
    items.forEach(item => {
      if (item.tipoEntrada === 'butaca') {
        const detalles = item.detalleEntrada.match(/Fila (\w+) - Butaca (\d+)/);
        if (detalles) {
          const fila = detalles[1];
          const numero = parseInt(detalles[2], 10);
          const eventoId = item.evento.id!;
          const lista = butacasPorEvento.get(eventoId) || [];
          lista.push({ fila, numero });
          butacasPorEvento.set(eventoId, lista);
        }
      }
    });

    butacasPorEvento.forEach((butacas, eventoId) => {
      this.carritoServicio.desmarcarButacas(eventoId, butacas).subscribe({
        next: () => {},
        error: (err) => {
          console.error('Error desmarcando butacas:', err);
        }
      });
    });

    this.carritoServicio.vaciarCarrito();
    this.limpiarCupon();
    this.resetearEstadoCompra();
    if (this.usuario) {
      this.carritoServicio.sincronizarConServidor(this.usuario.id).subscribe({
        next: () => {},
        error: (err) => {}
      });
    }
    
    this.closeConfirmModal();
  }

  cargarCarritoUsuario(){
    if (!this.usuario) return;

    this.carritoServicio.obtenerCarritosPorUsuario(this.usuario.id).subscribe({
      next: (carritos) => {
        if (!carritos || carritos.length === 0) {
          this.carritoServicio.vaciarCarrito();
          return;
        }

        const backend = carritos[0];
        if (!backend.items || backend.items.length === 0) {
          this.carritoServicio.vaciarCarrito();
          return;
        }

        const eventosObs = backend.items.map(i => this.eventoServicio.obtenerEvento(String(i.eventoId)));
        forkJoin(eventosObs).subscribe({
          next: (eventos) => {
            const items: ItemCarrito[] = eventos.map((evento, id) => ({
              evento,
              cantidad: backend.items[id].cantidad,
              tipoEntrada: backend.items[id].tipoEntrada as 'sector' | 'butaca',
              detalleEntrada: backend.items[id].detalleEntrada,
              precioUnitario: backend.items[id].precioUnitario,
              addedAt: backend.items[id].addedAt
            }));

            // Se pasa el ancla guardada en el servidor para no reiniciar el plazo.
            this.carritoServicio.setItemsDirect(items, backend.inicioReserva);
          },
          error: (err) => {}
        });
      },
      error: (err) => {}
    });
  }

  continuarComprando(){
    this.router.navigate(['/lista-eventos']);
  }

  cerrarAvisoExpiracion(): void {
    this.carritoServicio.resetearNotificacionExpiracion();
  }

  private resetearEstadoCompra(){
    this.compraExitosa.set(false);
    this.mensajeCompra.set('');
    this.detalleCompra.set(null);
  }

  aplicarCupon() {
    const codigo = this.codigoCupon().trim().toUpperCase();

    if (!codigo) {
      this.mensajeCupon.set('Por favor ingresa un código de cupón');
      this.cuponEsError.set(true);
      return;
    }

    this.descuentoServicio.obtenerDescuentos().subscribe({
      next: (descuentos) => {
        const cuponEncontrado = descuentos.find(
          d => d.codigo.toUpperCase() === codigo
        );

        if (!cuponEncontrado) {
          this.mensajeCupon.set('Cupón no válido');
          this.cuponEsError.set(true);
          this.cuponAplicado.set(null);
          return;
        }

        if (!cuponEncontrado.activo) {
          this.mensajeCupon.set('Este cupón ya no está disponible');
          this.cuponEsError.set(true);
          this.cuponAplicado.set(null);
          return;
        }
        const hoy = new Date();
        const fechaInicio = new Date(cuponEncontrado.fechaInicio);
        const fechaFin = new Date(cuponEncontrado.fechaFin);

        if (hoy < fechaInicio) {
          this.mensajeCupon.set('Este cupón aún no es válido');
          this.cuponEsError.set(true);
          this.cuponAplicado.set(null);
          return;
        }

        if (hoy > fechaFin) {
          this.mensajeCupon.set('Este cupón ha expirado');
          this.cuponEsError.set(true);
          this.cuponAplicado.set(null);
          return;
        }
        this.cuponAplicado.set(cuponEncontrado);
        this.mensajeCupon.set(`Cupón aplicado: ${cuponEncontrado.porcentaje}% de descuento`);
        this.cuponEsError.set(false);
      },
      error: (error) => {
        this.cuponAplicado.set(null);
        this.modalService.notify('No se pudo validar el cupón. Intenta nuevamente en unos minutos.');
      }
    });
  }

  borrarCupon(){
    this.limpiarCupon();
    this.mensajeCupon.set('Cupón borrado');
    this.cuponEsError.set(false);
  }

  private limpiarCupon(){
    this.codigoCupon.set('');
    this.cuponAplicado.set(null);
    this.mensajeCupon.set('');
    this.cuponEsError.set(false);
  }

  procederAlPago() {
    const items = this.items();
    
    if (items.length === 0) {
      this.mensaje = 'No hay artículos en el carrito para procesar la compra';
      this.tipoMensaje = 'error';
      return;
    }

    if (!this.tarjetaSeleccionada()) {
      this.mensaje = 'Por favor selecciona o agrega una tarjeta de pago';
      this.tipoMensaje = 'error';
      return;
    }

    this.pendingAction = 'pagar';
    this.confirmMessage.set('¿Confirmar la compra?');
    this.showConfirmModal.set(true);
  }

  private confirmarPago() {
    const items = this.items();

    this.closeConfirmModal();

    this.procesandoCompra.set(true);

    // Antes de intentar comprar, valida si la entrada está disponible
    this.validarDisponibilidad(items).then(() => {
      this.actualizarEventosDisponibilidad(items).subscribe({
        next: () => {
          this.crearVentas(items);
        },
        error: (error) => {
          this.procesandoCompra.set(false);
          this.modalService.notify('No se pudo procesar la compra. Intenta nuevamente en unos minutos.');
        }
      });
    }).catch((msg) => {
      this.procesandoCompra.set(false);
      const texto = typeof msg === 'string' ? msg : 'Algunos artículos ya no están disponibles.';
      this.mensaje = texto;
      this.tipoMensaje = 'error';
    });
  }

  private validarDisponibilidad(items: ItemCarrito[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const itemsPorEvento = new Map<string, ItemCarrito[]>();
      items.forEach(item => {
        const eventoId = String(item.evento.id);
        if (!itemsPorEvento.has(eventoId)) itemsPorEvento.set(eventoId, []);
        itemsPorEvento.get(eventoId)!.push(item);
      });

      const checks = Array.from(itemsPorEvento.entries()).map(([eventoId, itemsEvento]) =>
        this.eventoServicio.obtenerEvento(eventoId).pipe(
          map((evento: Evento) => {
            for (const item of itemsEvento) {
              if (item.tipoEntrada === 'butaca') {
                const match = item.detalleEntrada.match(/Fila (\w+) - Butaca (\d+)/);
                if (!match) throw `Detalle de butaca inválido para el evento ${evento.titulo}`;
                const fila = match[1];
                const numero = parseInt(match[2]);
                const butaca = evento.butacas?.find((b: any) => b.fila === fila && b.numero === numero);
                if (!butaca) throw `Butaca no encontrada para ${evento.titulo}: Fila ${fila} Butaca ${numero}`;
              } else if (item.tipoEntrada === 'sector') {
                const sector = evento.sectores?.find((s: any) => s.nombre === item.detalleEntrada);
                if (!sector) throw `Sector ${item.detalleEntrada} no encontrado en ${evento.titulo}`;
                if ((sector.capacidad || 0) < item.cantidad) throw `No hay suficientes entradas en ${item.detalleEntrada} para ${evento.titulo} (disponible: ${sector.capacidad || 0})`;
              }
            }
            return true;
          })
        )
      );

      if (checks.length === 0) return resolve();

      forkJoin(checks).subscribe({
        next: () => resolve(),
        error: (err) => reject(err)
      });
    });
  }

  private actualizarEventosDisponibilidad(items: ItemCarrito[]) {
    const itemsPorEvento = new Map<string, ItemCarrito[]>();
    
    items.forEach(item => {
      const eventoId = item.evento.id!.toString();
      if (!itemsPorEvento.has(eventoId)) {
        itemsPorEvento.set(eventoId, []);
      }
      itemsPorEvento.get(eventoId)!.push(item);
    });

    const actualizaciones = Array.from(itemsPorEvento.entries()).map(([eventoId, itemsEvento]) => {
      return new Promise((resolve, reject) => {
        this.eventoServicio.obtenerEvento(eventoId).subscribe({
          next: (evento) => {
            let eventoModificado = { ...evento };

            itemsEvento.forEach(item => {
              if (item.tipoEntrada === 'butaca') {
                const match = item.detalleEntrada.match(/Fila (\w+) - Butaca (\d+)/);
                if (match && eventoModificado.butacas) {
                  const fila = match[1];
                  const numero = parseInt(match[2]);
                  
                  eventoModificado.butacas = eventoModificado.butacas.map(b => {
                    if (b.fila === fila && b.numero === numero) {
                      return { ...b, disponible: false };
                    }
                    return b;
                  });
                }
              } else if (item.tipoEntrada === 'sector') {
                if (eventoModificado.sectores) {
                  eventoModificado.sectores = eventoModificado.sectores.map(s => {
                    if (s.nombre === item.detalleEntrada) {
                      return { ...s, capacidad: s.capacidad - item.cantidad };
                    }
                    return s;
                  });
                }
              }
            });

            this.eventoServicio.actualizarEvento(eventoModificado, evento.id!).subscribe({
              next: () => resolve(true),
              error: (err) => reject(err)
            });
          },
          error: (err) => reject(err)
        });
      });
    });

    return forkJoin(actualizaciones);
  }

  private crearVentas(items: ItemCarrito[]) {
    const descuentoAplicado = this.descuentoPorcentaje();
    const factorDescuento = 1 - (descuentoAplicado / 100);
    
    const ventas: Venta[] = items.map(item => {
      const totalSinDescuento = item.precioUnitario * item.cantidad;
      const totalConDescuento = totalSinDescuento * factorDescuento;
      
      const venta: Venta = {
        eventoId: item.evento.id!,
        usuarioId: this.usuario.id,
        eventoTitulo: item.evento.titulo,
        cantidad: item.cantidad,
        fecha: new Date().toISOString(),
        total: totalConDescuento,
        tipo: item.tipoEntrada,
        detalle: item.detalleEntrada
      };

      if (item.tipoEntrada === 'butaca') {
        const match = item.detalleEntrada.match(/Fila (\w+) - Butaca (\d+)/);
        if (match) {
          venta.butacasVendidas = [{
            fila: match[1],
            numero: parseInt(match[2])
          }];
        }
      } else if (item.tipoEntrada === 'sector') {
        venta.sectoresVendidos = [{
          nombre: item.detalleEntrada,
          cantidad: item.cantidad
        }];
      }

      return venta;
    });

    let ventasExitosas = 0;
    let ventasFallidas = 0;

    ventas.forEach((venta, index) => {
      this.ventaServicio.crearVenta(venta).subscribe({
        next: (resultado) => {
          ventasExitosas++;

          if (ventasExitosas + ventasFallidas === ventas.length) {
            this.finalizarCompra(ventasExitosas, ventasFallidas);
          }
        },
        error: (error) => {
          ventasFallidas++;
          
          if (ventasExitosas + ventasFallidas === ventas.length) {
            this.finalizarCompra(ventasExitosas, ventasFallidas);
          }
        }
      });
    });
  }

  private finalizarCompra(exitosas: number, fallidas: number){
    this.procesandoCompra.set(false);

    if (fallidas === 0) {
      this.compraExitosa.set(true);
      this.mensajeCompra.set('¡Compra realizada con éxito!');
      
      const tarjeta = this.tarjetaSeleccionada();
      this.detalleCompra.set({
        ventasProcesadas: exitosas,
        totalPagado: this.total(),
        descuentoAplicado: this.descuentoPorcentaje(),
        tarjetaUsada: tarjeta ? `${tarjeta.tipo} ****${tarjeta.numeroTarjeta}` : undefined
      });
      
      this.carritoServicio.vaciarCarrito();
      this.limpiarCupon();
      if (this.usuario && this.usuario.id) {
        try {
          this.carritoServicio.sincronizarConServidor(String(this.usuario.id)).subscribe({
            next: () => {},
            error: (err) => {}
          });
        } catch (e) {}
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (exitosas > 0) {
      this.compraExitosa.set(true);
      this.mensajeCompra.set(`Compra parcialmente completada. ${exitosas} venta(s) exitosa(s), ${fallidas} venta(s) fallida(s)`);
      
      const tarjeta = this.tarjetaSeleccionada();
      this.detalleCompra.set({
        ventasProcesadas: exitosas,
        totalPagado: this.total(),
        descuentoAplicado: this.descuentoPorcentaje(),
        tarjetaUsada: tarjeta ? `${tarjeta.tipo} ****${tarjeta.numeroTarjeta}` : undefined
      });
      
      this.carritoServicio.vaciarCarrito();
      this.limpiarCupon();
      if (this.usuario && this.usuario.id) {
        try {
          this.carritoServicio.sincronizarConServidor(String(this.usuario.id)).subscribe({
            next: () => {},
            error: (err) => {}
          });
        } catch (e) {}
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.modalService.notify('No se pudo procesar la compra. Intenta nuevamente en unos minutos.');
    }
  }

  closeConfirmModal(): void {
    this.showConfirmModal.set(false);
    this.pendingAction = null;
    this.pendingItemIndex = null;
    this.confirmMessage.set('');
  }

  confirmAction(): void {
    switch (this.pendingAction) {
      case 'eliminar':
        this.confirmarEliminarItem();
        break;
      case 'vaciar':
        this.confirmarVaciarCarrito();
        break;
      case 'pagar':
        this.confirmarPago();
        break;
    }
  }
}

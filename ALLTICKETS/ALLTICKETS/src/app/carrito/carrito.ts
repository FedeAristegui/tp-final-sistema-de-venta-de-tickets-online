import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CarritoServicio, ItemCarrito } from '../servicios/carrito.servicio';
import { VentaServicio } from '../servicios/venta.servicio';
import { ClienteDescuento } from '../servicios/cliente-descuento';
import { TarjetaServicio } from '../servicios/tarjeta.servicio';
import { EventoServicio } from '../servicios/evento.servicio';
import { Venta } from '../modelos/venta';
import { Descuento } from '../modelos/descuento';
import { Tarjeta } from '../modelos/tarjeta';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { Evento } from '../modelos/evento';

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
  private router = inject(Router);
  private fb = inject(FormBuilder);
  
  items = this.carritoServicio.obtenerItems();
  subtotal = computed(() => this.carritoServicio.calcularTotal());
  cantidadTotal = computed(() => this.carritoServicio.obtenerCantidadTotal());
  
  procesandoCompra = signal<boolean>(false);
  compraExitosa = signal<boolean>(false);
  mensajeCompra = signal<string>('');
  detalleCompra = signal<{
    ventasProcesadas: number;
    totalPagado: number;
    descuentoAplicado: number;
    tarjetaUsada?: string;
  } | null>(null);
  
  // Sistema de tarjetas
  usuario: any = null;
  tarjetasUsuario = signal<Tarjeta[]>([]);
  tarjetaSeleccionada = signal<Tarjeta | null>(null);
  mostrarFormularioTarjeta = signal<boolean>(false);
  tarjetaForm: FormGroup;
  
  // Sistema de cupones
  codigoCupon = signal<string>('');
  cuponAplicado = signal<Descuento | null>(null);
  mensajeCupon = signal<string>('');
  descuentoPorcentaje = computed(() => this.cuponAplicado()?.porcentaje || 0);
  montoDescuento = computed(() => this.subtotal() * (this.descuentoPorcentaje() / 100));
  total = computed(() => this.subtotal() - this.montoDescuento());

  constructor() {
    this.tarjetaForm = this.fb.group({
      numeroTarjeta: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
      titular: ['', [Validators.required, Validators.minLength(3)]],
      vencimiento: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]],
      cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
      tipo: ['Visa', Validators.required]
    });
  }

  ngOnInit(): void {
    const data = localStorage.getItem('usuarioLogueado');
    this.usuario = data ? JSON.parse(data) : null;

    // Limpiar carrito local para evitar mezclar datos entre usuarios
    this.carritoServicio.vaciarCarrito();

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
        console.error('Error al cargar tarjetas:', err);
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
      alert('Por favor completa todos los campos correctamente');
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
        alert('Tarjeta agregada correctamente ✅');
      },
      error: (err) => {
        console.error('Error al agregar tarjeta:', err);
        alert('Error al agregar tarjeta');
      }
    });
  }

  formatearNumeroTarjeta(numero: string){
    return `•••• •••• •••• ${numero}`;
  }

  obtenerIconoTarjeta(tipo: string){
    switch (tipo) {
      case 'Visa': return '💳';
      case 'Mastercard': return '💳';
      case 'American Express': return '💳';
      default: return '💳';
    }
  }

  eliminarItem(index: number){
    if (confirm('¿Estás seguro de que deseas eliminar este item del carrito?')) {
      this.carritoServicio.eliminarDelCarrito(index);
      if (this.usuario) {
        this.carritoServicio.sincronizarConServidor(this.usuario.id).subscribe({
          next: () => {},
          error: (err) => console.error('Error sincronizando carrito tras eliminar item:', err)
        });
      }
    }
  }

  actualizarCantidad(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const cantidad = parseInt(input.value, 10);
    
    if (cantidad > 0) {
      this.carritoServicio.actualizarCantidad(index, cantidad);
      if (this.usuario) {
        this.carritoServicio.sincronizarConServidor(this.usuario.id).subscribe({
          next: () => {},
          error: (err) => console.error('Error sincronizando carrito tras actualizar cantidad:', err)
        });
      }
    }
  }

  vaciarCarrito() {
    if (confirm('¿Estás seguro de que deseas vaciar el carrito?')) {
      this.carritoServicio.vaciarCarrito();
      this.limpiarCupon();
      this.resetearEstadoCompra();
      if (this.usuario) {
        this.carritoServicio.sincronizarConServidor(this.usuario.id).subscribe({
          next: () => {},
          error: (err) => console.error('Error sincronizando carrito tras vaciar:', err)
        });
      }
    }
  }

  cargarCarritoUsuario(){
    if (!this.usuario) return;

    this.carritoServicio.obtenerCarritosPorUsuario(this.usuario.id).subscribe({
      next: (carritos) => {
        if (!carritos || carritos.length === 0) {
          // Usuario no tiene carrito en servidor, asegurar que el local esté vacío
          this.carritoServicio.vaciarCarrito();
          return;
        }

        const backend = carritos[0];
        if (!backend.items || backend.items.length === 0) {
          // Carrito del usuario está vacío en servidor
          this.carritoServicio.vaciarCarrito();
          return;
        }

        // Pedir todos los eventos y reconstruir los ItemCarrito locales
        const eventosObs = backend.items.map(i => this.eventoServicio.obtenerEvento(String(i.eventoId)));
        forkJoin(eventosObs).subscribe({
          next: (eventos) => {
            const items: ItemCarrito[] = eventos.map((evento, id) => ({
              evento,
              cantidad: backend.items[id].cantidad,
              tipoEntrada: backend.items[id].tipoEntrada as 'sector' | 'butaca',
              detalleEntrada: backend.items[id].detalleEntrada,
              precioUnitario: backend.items[id].precioUnitario
            }));

            this.carritoServicio.setItemsDirect(items);
          },
          error: (err) => console.error('Error cargando eventos para carrito:', err)
        });
      },
      error: (err) => console.error('Error al obtener carritos del servidor:', err)
    });
  }

  continuarComprando(){
    this.router.navigate(['/lista-eventos']);
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
      return;
    }

    this.descuentoServicio.obtenerDescuentos().subscribe({
      next: (descuentos) => {
        const cuponEncontrado = descuentos.find(
          d => d.codigo.toUpperCase() === codigo
        );

        if (!cuponEncontrado) {
          this.mensajeCupon.set('❌ Cupón no válido');
          this.cuponAplicado.set(null);
          return;
        }

        if (!cuponEncontrado.activo) {
          this.mensajeCupon.set('❌ Este cupón ya no está disponible');
          this.cuponAplicado.set(null);
          return;
        }
        const hoy = new Date();
        const fechaInicio = new Date(cuponEncontrado.fechaInicio);
        const fechaFin = new Date(cuponEncontrado.fechaFin);

        if (hoy < fechaInicio) {
          this.mensajeCupon.set('❌ Este cupón aún no es válido');
          this.cuponAplicado.set(null);
          return;
        }

        if (hoy > fechaFin) {
          this.mensajeCupon.set('❌ Este cupón ha expirado');
          this.cuponAplicado.set(null);
          return;
        }
        this.cuponAplicado.set(cuponEncontrado);
        this.mensajeCupon.set(`✅ Cupón aplicado: ${cuponEncontrado.porcentaje}% de descuento`);
      },
      error: (error) => {
        console.error('Error al validar cupón:', error);
        this.mensajeCupon.set('❌ Error al validar el cupón');
        this.cuponAplicado.set(null);
      }
    });
  }

  borrarCupon(){
    this.limpiarCupon();
    this.mensajeCupon.set('Cupón removido');
  }

  private limpiarCupon(){
    this.codigoCupon.set('');
    this.cuponAplicado.set(null);
    this.mensajeCupon.set('');
  }

  procederAlPago() {
    const items = this.items();
    
    if (items.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    if (!this.tarjetaSeleccionada()) {
      alert('Por favor selecciona o agrega una tarjeta de pago');
      return;
    }

    if (!confirm('¿Confirmar la compra?')) {
      return;
    }

    this.procesandoCompra.set(true);

    // Antes de intentar actualizar y generar ventas, validar disponibilidad actual en el servidor
    this.validarDisponibilidad(items).then(() => {
      // Primero actualizamos los eventos para bloquear las butacas/sectores
      this.actualizarEventosDisponibilidad(items).subscribe({
        next: () => {
          // Luego creamos las ventas
          this.crearVentas(items);
        },
        error: (error) => {
          console.error('Error al actualizar disponibilidad:', error);
          this.procesandoCompra.set(false);
          alert('Error al procesar la compra. Por favor, intenta nuevamente.');
        }
      });
    }).catch((msg) => {
      // Si falla la validación, informar al usuario y detener el flujo
      this.procesandoCompra.set(false);
      const texto = typeof msg === 'string' ? msg : 'Algunos artículos ya no están disponibles.';
      alert(texto);
    });
  }

  // Valida contra el servidor que todos los items del carrito estén disponibles
  private validarDisponibilidad(items: ItemCarrito[]): Promise<void> {
    return new Promise((resolve, reject) => {
      // Agrupar por evento
      const itemsPorEvento = new Map<string, ItemCarrito[]>();
      items.forEach(item => {
        const eventoId = String(item.evento.id);
        if (!itemsPorEvento.has(eventoId)) itemsPorEvento.set(eventoId, []);
        itemsPorEvento.get(eventoId)!.push(item);
      });

      const checks = Array.from(itemsPorEvento.entries()).map(([eventoId, itemsEvento]) =>
        this.eventoServicio.obtenerEvento(eventoId).pipe(
          map((evento: Evento) => {
            // Para cada item de este evento validar
            for (const item of itemsEvento) {
              if (item.tipoEntrada === 'butaca') {
                const match = item.detalleEntrada.match(/Fila (\w+) - Butaca (\d+)/);
                if (!match) throw `Detalle de butaca inválido para el evento ${evento.titulo}`;
                const fila = match[1];
                const numero = parseInt(match[2]);
                const butaca = evento.butacas?.find((b: any) => b.fila === fila && b.numero === numero);
                if (!butaca) throw `Butaca no encontrada para ${evento.titulo}: Fila ${fila} Butaca ${numero}`;
                if (!butaca.disponible) throw `La butaca F${fila}#${numero} para ${evento.titulo} ya no está disponible.`;
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
    // Agrupar items por evento para actualizar cada evento solo una vez
    const itemsPorEvento = new Map<string, ItemCarrito[]>();
    
    items.forEach(item => {
      const eventoId = item.evento.id!.toString();
      if (!itemsPorEvento.has(eventoId)) {
        itemsPorEvento.set(eventoId, []);
      }
      itemsPorEvento.get(eventoId)!.push(item);
    });

    // Crear una actualización por cada evento único
    const actualizaciones = Array.from(itemsPorEvento.entries()).map(([eventoId, itemsEvento]) => {
      return new Promise((resolve, reject) => {
        this.eventoServicio.obtenerEvento(eventoId).subscribe({
          next: (evento) => {
            let eventoModificado = { ...evento };

            // Procesar todos los items de este evento
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

            // Actualizar el evento con todas las modificaciones
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
    const ventas: Venta[] = items.map(item => {
      const venta: Venta = {
        eventoId: item.evento.id!,
        usuarioId: this.usuario.id,
        eventoTitulo: item.evento.titulo,
        cantidad: item.cantidad,
        fecha: new Date().toISOString(),
        total: item.precioUnitario * item.cantidad,
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
          console.error('Error al procesar venta:', error);
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
      // Sincronizar con servidor para reflejar el carrito vacío
      if (this.usuario && this.usuario.id) {
        try {
          this.carritoServicio.sincronizarConServidor(String(this.usuario.id)).subscribe({
            next: () => {},
            error: (err) => console.error('Error sincronizando carrito tras compra exitosa:', err)
          });
        } catch (e) {
          console.error('Error iniciando sincronización de carrito tras compra exitosa:', e);
        }
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
      // Sincronizar con servidor para reflejar el carrito vacío (compra parcial también vacía los items)
      if (this.usuario && this.usuario.id) {
        try {
          this.carritoServicio.sincronizarConServidor(String(this.usuario.id)).subscribe({
            next: () => {},
            error: (err) => console.error('Error sincronizando carrito tras compra parcial:', err)
          });
        } catch (e) {
          console.error('Error iniciando sincronización de carrito tras compra parcial:', e);
        }
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      alert('Error al procesar la compra. Por favor, intenta nuevamente.');
    }
  }
}

import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CarritoServicio, ItemCarrito } from '../servicios/carrito.servicio';
import { VentaServicio } from '../servicios/venta.servicio';
import { ClienteDescuento } from '../descuento/cliente-descuento';
import { TarjetaServicio } from '../servicios/tarjeta.servicio';
import { Venta } from '../modelos/venta';
import { Descuento } from '../modelos/descuento';
import { Tarjeta } from '../modelos/tarjeta';

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

    if (this.usuario) {
      this.cargarTarjetasUsuario();
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
    }
  }

  actualizarCantidad(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const cantidad = parseInt(input.value, 10);
    
    if (cantidad > 0) {
      this.carritoServicio.actualizarCantidad(index, cantidad);
    }
  }

  vaciarCarrito() {
    if (confirm('¿Estás seguro de que deseas vaciar el carrito?')) {
      this.carritoServicio.vaciarCarrito();
      this.limpiarCupon();
      this.resetearEstadoCompra();
    }
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

    if (!this.usuario) {
      alert('Debes iniciar sesión para realizar la compra');
      this.router.navigate(['/login']);
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      alert('Error al procesar la compra. Por favor, intenta nuevamente.');
    }
  }
}

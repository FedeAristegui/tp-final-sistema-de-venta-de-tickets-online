export interface Carrito {
  id?: string;
  usuarioId: string;
  items: {
    eventoId: string;
    cantidad: number;
    tipoEntrada: 'sector' | 'butaca';
    detalleEntrada: string;
    precioUnitario: number;
    addedAt?: string;
  }[];
  fechaActualizacion: string;
  /**
   * Momento en que el carrito pasó de vacío a tener su primera entrada.
   * Es el ancla del temporizador de reserva: agregar más entradas NO lo mueve,
   * así que no se puede estirar el plazo cargando cosas al carrito.
   */
  inicioReserva?: string;
}

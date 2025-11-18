export interface Carrito {
  id?: string;
  usuarioId: string;
  items: {
    eventoId: string;
    cantidad: number;
    tipoEntrada: 'sector' | 'butaca';
    detalleEntrada: string;
    precioUnitario: number;
  }[];
  fechaActualizacion: string;
}

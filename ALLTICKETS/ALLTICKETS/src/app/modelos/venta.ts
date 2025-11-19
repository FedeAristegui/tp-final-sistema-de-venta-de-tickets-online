export interface Venta {
  id?: number;
  usuarioId: number | string; 
  eventoId: number | string; 
  eventoTitulo?: string;
  cantidad: number;
  fecha: string;
  total: number;
  tipo: 'sector' | 'butaca';
  detalle?: string; 
  // Detalles específicos por tipo de venta
  butacasVendidas?: { fila: string; numero: number }[]; // Para ventas por butaca
  sectoresVendidos?: { nombre: string; cantidad: number }[]; // Para ventas por sector
}

export interface EstadisticaEvento {
  eventoId: number | string; 
  eventoTitulo: string;
  totalVendidas: number;
  totalRecaudado: number;
  porcentajeOcupacion: number;
  capacidadTotal: number;
  detalleVentas?: {
    butacas?: { fila: string; numero: number; cantidad: number }[];
    sectores?: { nombre: string; cantidad: number }[];
  };
}

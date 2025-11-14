export interface Venta {
  id?: number;
  eventoId: number | string; // Permitir string o number
  eventoTitulo?: string;
  cantidad: number;
  fecha: string;
  total: number;
  tipo: 'sector' | 'butaca';
  detalle?: string; // Ejemplo: "VIP - 2 entradas" o "Fila A - Butacas 5,6"
  // Detalles específicos por tipo de venta
  butacasVendidas?: { fila: string; numero: number }[]; // Para ventas por butaca
  sectoresVendidos?: { nombre: string; cantidad: number }[]; // Para ventas por sector
}

export interface EstadisticaEvento {
  eventoId: number | string; // Permitir string o number
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

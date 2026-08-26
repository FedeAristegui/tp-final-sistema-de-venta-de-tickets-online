/** Punto geográfico del evento, para mostrarlo en Google Maps. */
export interface Ubicacion {
  lat: number;
  lng: number;
  direccion: string;
}

export interface Evento {
  id?: number ;
  titulo: string ;
  fecha: string ;
  hora: string ;
  lugar: string ;
  ubicacion?: Ubicacion ;
  imagen: string ;
  categoria: string ;
  modoVenta: 'sector' | 'butaca' ;
  sectores: { nombre: string; capacidad: number; precio: number }[];
  butacas: { fila: string; numero: number; precio: number; disponible: boolean }[];
}

/** Punto geográfico del evento, para mostrarlo en Google Maps. */
export interface Ubicacion {
  lat: number;
  lng: number;
  /** Dirección legible que devuelve Google (ej: "Av. Pres. Figueroa Alcorta 7597, CABA"). */
  direccion: string;
}

export interface Evento {
  id?: number ;
  titulo: string ;
  fecha: string ;
  hora: string ;
  /** Nombre del lugar (ej: "Estadio Monumental"). Es lo que se busca y ordena en los listados. */
  lugar: string ;
  /** Opcional: los eventos cargados antes de sumar el mapa no la tienen. */
  ubicacion?: Ubicacion ;
  imagen: string ;
  categoria: string ;
  modoVenta: 'sector' | 'butaca' ;
  sectores: { nombre: string; capacidad: number; precio: number }[];
  butacas: { fila: string; numero: number; precio: number; disponible: boolean }[];
}

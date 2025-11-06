export interface Evento {
  id?: number;             // opcional para nuevo evento
  titulo: string;
  fecha: String; 
  hora: string; 
  imagen: string;         
  modoVenta: 'sector' | 'butaca';  
  // Para modoSector:
  sectores?: Sector[];
  // Para modoButaca:
  butacas?: Butaca[];
}

export interface Sector {
  nombre: string;
  capacidad: number;
  precio: number;
}

export interface Butaca {
  fila: string;
  numero: number;
  precio: number;
  disponible: boolean;
}

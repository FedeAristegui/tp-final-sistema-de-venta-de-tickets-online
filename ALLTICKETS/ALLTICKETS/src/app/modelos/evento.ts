export type CategoriaEvento = 'Deportes' | 'Música' | 'Comedia';

export interface Evento {
  id?: number ;
  titulo: string ;      
  fecha: string ;
  hora: string ;
  lugar: string ;
  imagen: string ;
  categoria?: CategoriaEvento;
  modoVenta: 'sector' | 'butaca' ;
  sectores: { nombre: string; capacidad: number; precio: number }[];
  butacas: { fila: string; numero: number; precio: number; disponible: boolean }[];
}

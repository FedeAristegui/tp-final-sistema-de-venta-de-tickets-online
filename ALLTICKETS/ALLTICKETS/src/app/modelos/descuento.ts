export interface Descuento {
    id?: number | string;
    codigo: string;
    porcentaje: number; 
    fechaInicio: string;
    fechaFin: string;
    activo: boolean;
}

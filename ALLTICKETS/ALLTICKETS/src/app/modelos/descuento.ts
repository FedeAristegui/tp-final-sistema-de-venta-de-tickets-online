export interface Descuento {
    id?: number | string;
    codigo: string;
    porcentaje: number; // o 'descuentoPorcentaje'
    fechaInicio: string;
    fechaFin: string;
    activo: boolean;
}

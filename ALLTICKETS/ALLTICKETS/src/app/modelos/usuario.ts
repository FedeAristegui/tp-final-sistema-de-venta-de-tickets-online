export interface usuario {
  id?: string | number;
  nombre?: string;
  apellido?: string;
  email: string;
  contrasena?: string;
  rol: string;
  fechaRegistro?: string;
  ultimaActividad?: string;
  activo?: boolean;
}
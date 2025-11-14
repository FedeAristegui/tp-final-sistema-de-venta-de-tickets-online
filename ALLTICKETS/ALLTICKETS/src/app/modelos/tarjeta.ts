export interface Tarjeta {
  id?: string;
  usuarioId: string;
  numeroTarjeta: string; // Últimos 4 dígitos para mostrar
  titular: string;
  vencimiento: string; // MM/YY
  tipo: 'Visa' | 'Mastercard' | 'American Express' | 'Cabal' | 'Naranja';
  esPrincipal: boolean;
  fechaAgregada: string;
}

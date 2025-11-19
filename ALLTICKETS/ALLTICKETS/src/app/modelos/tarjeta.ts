export interface Tarjeta {
  id?: string;
  usuarioId: string;
  numeroTarjeta: string; 
  titular: string;
  vencimiento: string; // MM/YY
  tipo: 'Visa' | 'Mastercard' | 'American Express' | 'Cabal' | 'Naranja';
  esPrincipal: boolean;
  fechaAgregada: string;
}

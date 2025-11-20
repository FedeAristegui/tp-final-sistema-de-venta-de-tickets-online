export interface Tarjeta {
  id?: string;
  usuarioId: string;
  numeroTarjeta: string; 
  titular: string;
  vencimiento: string; // MM/AA
  tipo: 'Visa' | 'Mastercard' | 'American Express' | 'Cabal' | 'Naranja';
  esPrincipal: boolean;
  fechaAgregada: string;
}

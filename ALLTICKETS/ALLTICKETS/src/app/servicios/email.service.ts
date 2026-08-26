import { Injectable } from '@angular/core';
import emailjs from '@emailjs/browser';

export interface EntradaCompra {
  detalle: string;
  tipoTexto: string;
  cantidad: number;
  precioUnitario: number;
}

export interface EventoCompra {
  titulo: string;
  fecha: string;
  hora: string;
  lugar: string;
  direccion?: string;
  mapaUrl?: string;
  entradas: EntradaCompra[];
}

export interface DatosCompra {
  usuarioNombre: string;
  usuarioEmail: string;
  eventos: EventoCompra[];
  subtotal: number;
  descuentoPorcentaje: number;
  montoDescuento: number;
  total: number;
  tarjetaUsada?: string;
  fechaCompra: string;
}

const formatearMoneda = (valor: number) => `$${valor.toFixed(2)}`;

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private readonly SERVICE_ID = 'service_0m22ydp';
  private readonly PUBLIC_KEY = '9MBk0zUwOiBriG86_';
  private readonly TEMPLATE_ID = 'template_sr10ake';
  private readonly TEMPLATE_ID_RECUPERACION = 'template_co2ahee';

  constructor() {
    emailjs.init(this.PUBLIC_KEY);
  }

  async enviarResumenCompra(datos: DatosCompra): Promise<void> {
    try {
      const eventos = datos.eventos.map(evento => {
        const cantidadTotal = evento.entradas.reduce((acc, e) => acc + e.cantidad, 0);
        const subtotalEvento = evento.entradas.reduce((acc, e) => acc + e.cantidad * e.precioUnitario, 0);

        return {
          titulo: evento.titulo,
          fecha_texto: evento.fecha,
          hora: evento.hora,
          lugar: evento.lugar,
          direccion: evento.direccion || '',
          mapa_url: evento.mapaUrl || '',
          entradas: evento.entradas.map(entrada => ({
            detalle: entrada.detalle,
            tipo_texto: entrada.tipoTexto,
            cantidad: entrada.cantidad,
            precio_unitario: formatearMoneda(entrada.precioUnitario),
            subtotal_entrada: formatearMoneda(entrada.cantidad * entrada.precioUnitario)
          })),
          resumen_cantidad: `${cantidadTotal} entrada${cantidadTotal === 1 ? '' : 's'}`,
          subtotal_evento: formatearMoneda(subtotalEvento)
        };
      });

      const descuento = datos.montoDescuento > 0
        ? { etiqueta: `Descuento (${datos.descuentoPorcentaje}%)`, monto: formatearMoneda(datos.montoDescuento) }
        : '';

      const templateParams = {
        preheader: `Tu compra fue confirmada. Total pagado: ${formatearMoneda(datos.total)}`,
        email_destinatario: datos.usuarioEmail,
        nombre_destinatario: datos.usuarioNombre,
        responder_a: datos.usuarioEmail,
        fecha_compra: datos.fechaCompra,
        eventos,
        subtotal_etiqueta: 'Subtotal',
        subtotal_compra: formatearMoneda(datos.subtotal),
        descuento,
        total_compra: formatearMoneda(datos.total),
        medio_pago: datos.tarjetaUsada || ''
      };

      const response = await emailjs.send(
        this.SERVICE_ID,
        this.TEMPLATE_ID,
        templateParams
      );

      console.log('Email enviado exitosamente:', response);
    } catch (error) {
      console.error('Error al enviar el email:', error);
      throw error;
    }
  }

  async enviarCodigoRecuperacion(email: string, nombre: string, codigo: string): Promise<void> {
    const templateParams = {
      preheader: `Tu código para restablecer la contraseña es ${codigo}`,
      email_destinatario: email,
      nombre_destinatario: nombre || 'Usuario',
      responder_a: email,
      codigo_recuperacion: codigo
    };

    try {
      const response = await emailjs.send(
        this.SERVICE_ID,
        this.TEMPLATE_ID_RECUPERACION,
        templateParams
      );
      console.log('Email de recuperación enviado exitosamente:', response);
    } catch (error) {
      console.error('Error al enviar el email de recuperación:', error);
      throw error;
    }
  }
}

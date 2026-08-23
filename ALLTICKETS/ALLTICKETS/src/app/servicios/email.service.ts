import { Injectable } from '@angular/core';
import emailjs from '@emailjs/browser';

export interface DatosCompra {
  usuarioNombre: string;
  usuarioEmail: string;
  items: {
    eventoTitulo: string;
    cantidad: number;
    precioUnitario: number;
    detalleEntrada: string;
    fecha: string;
    hora: string;
    lugar: string;
  }[];
  subtotal: number;
  descuentoPorcentaje: number;
  montoDescuento: number;
  total: number;
  tarjetaUsada?: string;
  fechaCompra: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private readonly SERVICE_ID = 'service_0m22ydp';
  private readonly PUBLIC_KEY = '9MBk0zUwOiBriG86_';
  // Nota: Necesitas crear una plantilla en EmailJS con este ID o cambiarlo por tu plantilla
  private readonly TEMPLATE_ID = 'template_q9t71sl';
  // Plantilla separada para el código de recuperación de contraseña (crear en EmailJS)
  private readonly TEMPLATE_ID_RECUPERACION = 'template_co2ahee';

  constructor() {
    // Inicializar EmailJS con la clave pública
    emailjs.init(this.PUBLIC_KEY);
  }

  /**
   * Envía un correo con el resumen de la compra al usuario
   */
  async enviarResumenCompra(datos: DatosCompra): Promise<void> {
    try {
      // Formatear la lista de items para el email
      const itemsFormateados = datos.items.map(item => 
        `- ${item.eventoTitulo}
  Fecha: ${item.fecha} - ${item.hora}
  Lugar: ${item.lugar}
  ${item.detalleEntrada}
  Cantidad: ${item.cantidad} x $${item.precioUnitario.toFixed(2)} = $${(item.cantidad * item.precioUnitario).toFixed(2)}`
      ).join('\n\n');

      // Preparar los parámetros para la plantilla de EmailJS
      const templateParams = {
        to_email: datos.usuarioEmail,
        to_name: datos.usuarioNombre,
        items_detalle: itemsFormateados,
        subtotal: datos.subtotal.toFixed(2),
        descuento_porcentaje: datos.descuentoPorcentaje,
        monto_descuento: datos.montoDescuento.toFixed(2),
        total: datos.total.toFixed(2),
        tarjeta_usada: datos.tarjetaUsada || 'N/A',
        fecha_compra: datos.fechaCompra,
        cantidad_items: datos.items.length
      };

      // Enviar el email
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

  /**
   * Envía un correo con el código para restablecer la contraseña
   */
  async enviarCodigoRecuperacion(email: string, nombre: string, codigo: string): Promise<void> {
    const templateParams = {
      to_email: email,
      to_name: nombre || 'Usuario',
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

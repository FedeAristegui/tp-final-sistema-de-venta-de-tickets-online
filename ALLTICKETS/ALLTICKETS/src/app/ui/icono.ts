import { Component, input } from '@angular/core';

/**
 * Nombres válidos de icono. Al ser una unión de literales, `strictTemplates`
 * marca en tiempo de compilación cualquier nombre mal escrito en un template.
 */
export type NombreIcono =
  | 'alerta'
  | 'basura'
  | 'bolsa'
  | 'buscar'
  | 'butaca'
  | 'calendario'
  | 'candado'
  | 'carrito'
  | 'cerrar'
  | 'check'
  | 'corazon'
  | 'corazon-lleno'
  | 'estrella'
  | 'estrella-llena'
  | 'etiqueta'
  | 'flecha-der'
  | 'flecha-izq'
  | 'grafico'
  | 'imagen'
  | 'lapiz'
  | 'mapa'
  | 'mas'
  | 'mascara'
  | 'menos'
  | 'menu'
  | 'ojo'
  | 'ojo-off'
  | 'pin'
  | 'reloj'
  | 'salir'
  | 'tarjeta'
  | 'ticket'
  | 'usuario';

/**
 * Icono SVG de trazo, dibujado en línea (sin dependencias ni requests).
 *
 * Todos comparten grilla de 24x24 y grosor de trazo 1.5, y heredan el color del
 * texto (`currentColor`), así un mismo icono sirve sobre fondo claro, sobre el
 * violeta de marca o dentro de un botón sin necesidad de variantes.
 *
 * Es decorativo por defecto (`aria-hidden`): el significado siempre lo aporta el
 * texto que lo acompaña o el `aria-label` del botón que lo contiene.
 */
@Component({
  selector: 'app-icono',
  standalone: true,
  template: `
    <svg
      [attr.width]="tamano()"
      [attr.height]="tamano()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      @switch (nombre()) {
        @case ('alerta') {
          <path d="M12 9v4M12 17h.01" />
          <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        }
        @case ('basura') {
          <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
        }
        @case ('bolsa') {
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        }
        @case ('buscar') {
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.6-3.6" />
        }
        @case ('butaca') {
          <path d="M6 12V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6" />
          <path d="M4 12a2 2 0 0 1 2 2v3h12v-3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v5H2v-5a2 2 0 0 1 2-2Z" />
        }
        @case ('calendario') {
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        }
        @case ('candado') {
          <rect x="4" y="10" width="16" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        }
        @case ('carrito') {
          <circle cx="9" cy="20" r="1.4" />
          <circle cx="18" cy="20" r="1.4" />
          <path d="M2 3h2.2l2.4 12.1a1.6 1.6 0 0 0 1.6 1.3h8.9a1.6 1.6 0 0 0 1.6-1.3L21 7H5.2" />
        }
        @case ('cerrar') {
          <path d="M18 6 6 18M6 6l12 12" />
        }
        @case ('check') {
          <path d="m4 12.5 5 5L20 6.5" />
        }
        @case ('corazon') {
          <path d="M12 20.3 3.9 12.2a5 5 0 0 1 7.1-7.1l1 1 1-1a5 5 0 0 1 7.1 7.1Z" />
        }
        @case ('corazon-lleno') {
          <path
            d="M12 20.3 3.9 12.2a5 5 0 0 1 7.1-7.1l1 1 1-1a5 5 0 0 1 7.1 7.1Z"
            fill="currentColor"
          />
        }
        @case ('estrella') {
          <path d="m12 3.5 2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.9-5.4 2.9 1-6L3.2 9.9l6.1-.9Z" />
        }
        @case ('estrella-llena') {
          <path
            d="m12 3.5 2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.9-5.4 2.9 1-6L3.2 9.9l6.1-.9Z"
            fill="currentColor"
          />
        }
        @case ('etiqueta') {
          <path d="M3 12.4V4a1 1 0 0 1 1-1h8.4a2 2 0 0 1 1.4.6l6.6 6.6a2 2 0 0 1 0 2.8l-7.4 7.4a2 2 0 0 1-2.8 0L3.6 13.8a2 2 0 0 1-.6-1.4Z" />
          <path d="M7.5 7.5h.01" />
        }
        @case ('flecha-der') {
          <path d="M4 12h16M14 6l6 6-6 6" />
        }
        @case ('flecha-izq') {
          <path d="M20 12H4M10 18l-6-6 6-6" />
        }
        @case ('grafico') {
          <path d="M3 3v16a2 2 0 0 0 2 2h16" />
          <path d="M7 15V11M12 15V6M17 15v-6" />
        }
        @case ('imagen') {
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="8.5" cy="9.5" r="1.5" />
          <path d="m4 17 5-5 3.5 3.5L16 12l4 4" />
        }
        @case ('lapiz') {
          <path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
          <path d="m15 6 3 3" />
        }
        @case ('mapa') {
          <path d="m3 6.5 6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5Z" />
          <path d="M9 4v14M15 6.5v14" />
        }
        @case ('mas') {
          <path d="M12 5v14M5 12h14" />
        }
        @case ('mascara') {
          <path d="M3 5h18v6a9 9 0 0 1-18 0Z" />
          <path d="M8.5 10h.01M15.5 10h.01" />
          <path d="M9.5 15a3.5 3.5 0 0 0 5 0" />
        }
        @case ('menos') {
          <path d="M5 12h14" />
        }
        @case ('menu') {
          <path d="M3 6h18M3 12h18M3 18h18" />
        }
        @case ('ojo') {
          <path d="M2.2 12S5.5 5.5 12 5.5 21.8 12 21.8 12 18.5 18.5 12 18.5 2.2 12 2.2 12Z" />
          <circle cx="12" cy="12" r="3" />
        }
        @case ('ojo-off') {
          <path d="M10.6 6.1A8.6 8.6 0 0 1 12 6c6.5 0 9.8 6 9.8 6a15.7 15.7 0 0 1-3.3 4" />
          <path d="M6.4 7.8A15.5 15.5 0 0 0 2.2 12S5.5 18 12 18a9.3 9.3 0 0 0 4-.9" />
          <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
          <path d="m3 3 18 18" />
        }
        @case ('pin') {
          <path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z" />
          <circle cx="12" cy="10" r="2.5" />
        }
        @case ('reloj') {
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5.2l3.2 2" />
        }
        @case ('salir') {
          <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
          <path d="M10 8 6 12l4 4M6 12h10" />
        }
        @case ('tarjeta') {
          <rect x="2.5" y="5" width="19" height="14" rx="2" />
          <path d="M2.5 9.5h19" />
          <path d="M6 14.5h3" />
        }
        @case ('ticket') {
          <path d="M3 8.5V6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2.5a3.5 3.5 0 0 0 0 7V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2.5a3.5 3.5 0 0 0 0-7Z" />
          <path d="M14 5v3M14 11v2M14 16v3" />
        }
        @case ('usuario') {
          <circle cx="12" cy="8" r="4" />
          <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
        }
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: none;
      /* El trazo no debe engordar cuando el icono se escala dentro de un botón. */
      vector-effect: non-scaling-stroke;
    }
  `,
})
export class Icono {
  readonly nombre = input.required<NombreIcono>();
  /** Lado del icono en píxeles. 18 acompaña al texto de 15px sin dominarlo. */
  readonly tamano = input<number>(18);
}

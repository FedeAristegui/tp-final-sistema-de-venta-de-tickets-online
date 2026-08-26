import {
  AfterViewInit,
  Component,
  ElementRef,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { GoogleMapsLoader } from '../../servicios/google-maps.loader';
import { Icono } from '../../ui/icono';

/**
 * Muestra la ubicación de un evento en un mapa de Google, en modo sólo lectura.
 *
 * Recibe las coordenadas como números sueltos (y no como un objeto) a propósito:
 * la ficha del evento refresca el evento cada 2,5 segundos, y con un objeto el
 * mapa se reconstruiría en cada refresco porque la referencia cambia aunque las
 * coordenadas sean las mismas. Con números, el signal input compara por valor
 * y no notifica si la posición no cambió.
 */
@Component({
  selector: 'app-mapa-ubicacion',
  standalone: true,
  imports: [Icono],
  templateUrl: './mapa-ubicacion.html',
  styleUrl: './mapa-ubicacion.css',
})
export class MapaUbicacion implements AfterViewInit {
  readonly lat = input.required<number>();
  readonly lng = input.required<number>();
  /** Nombre del lugar, se usa como rótulo del pin. */
  readonly titulo = input('');
  readonly direccion = input('');

  private readonly loader = inject(GoogleMapsLoader);
  private readonly contenedor = viewChild.required<ElementRef<HTMLDivElement>>('contenedorMapa');

  protected readonly estado = signal<'cargando' | 'listo' | 'sin-key' | 'error'>('cargando');

  private mapa?: google.maps.Map;
  private marcador?: google.maps.Marker;

  constructor() {
    // Reposiciona el pin si cambian las coordenadas, sin volver a crear el mapa.
    effect(() => {
      const posicion = { lat: this.lat(), lng: this.lng() };
      if (!this.mapa) return;
      this.mapa.setCenter(posicion);
      this.marcador?.setPosition(posicion);
    });
  }

  async ngAfterViewInit(): Promise<void> {
    try {
      await this.loader.cargar();

      const posicion = { lat: this.lat(), lng: this.lng() };
      this.mapa = new google.maps.Map(this.contenedor().nativeElement, {
        center: posicion,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
      });

      this.marcador = new google.maps.Marker({
        map: this.mapa,
        position: posicion,
        title: this.titulo(),
      });

      this.estado.set('listo');
    } catch (error) {
      this.estado.set(error === 'SIN_API_KEY' ? 'sin-key' : 'error');
    }
  }

  protected urlComoLlegar(): string {
    return `https://www.google.com/maps/search/?api=1&query=${this.lat()},${this.lng()}`;
  }
}

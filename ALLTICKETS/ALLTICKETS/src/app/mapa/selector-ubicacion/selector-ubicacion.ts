import {
  AfterViewInit,
  Component,
  ElementRef,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { GoogleMapsLoader } from '../../servicios/google-maps.loader';
import { CENTRO_POR_DEFECTO } from '../../config/google-maps.config';
import { Ubicacion } from '../../modelos/evento';

/**
 * Selector de ubicación para el panel de administración.
 *
 * El admin puede fijar el punto de tres formas, y las tres terminan en el mismo
 * lugar: buscando la dirección, haciendo click en el mapa, o arrastrando el pin.
 * Que el buscador no sea el único camino es a propósito: si la Places API no
 * está habilitada en la key, se puede seguir marcando el punto a mano.
 */
@Component({
  selector: 'app-selector-ubicacion',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './selector-ubicacion.html',
  styleUrl: './selector-ubicacion.css',
})
export class SelectorUbicacion implements AfterViewInit {
  /** Ubicación ya guardada del evento que se está editando. */
  readonly valorInicial = input<Ubicacion | null>(null);
  readonly ubicacionCambiada = output<Ubicacion | null>();

  private readonly loader = inject(GoogleMapsLoader);
  private readonly contenedorMapa = viewChild.required<ElementRef<HTMLDivElement>>('contenedorMapa');
  private readonly contenedorBuscador =
    viewChild.required<ElementRef<HTMLDivElement>>('contenedorBuscador');

  protected readonly estado = signal<'cargando' | 'listo' | 'sin-key' | 'error'>('cargando');
  protected readonly seleccion = signal<Ubicacion | null>(null);
  /** El buscador se desactiva si la Places API no está habilitada en la key. */
  protected readonly buscadorDisponible = signal(true);

  private mapa?: google.maps.Map;
  private marcador?: google.maps.Marker;
  private geocoder?: google.maps.Geocoder;

  constructor() {
    // Cuando el formulario termina de cargar el evento a editar, refleja su ubicación.
    effect(() => {
      const inicial = this.valorInicial();
      if (!inicial) return;

      const actual = this.seleccion();
      const yaEstaPuesta =
        actual && actual.lat === inicial.lat && actual.lng === inicial.lng;
      if (yaEstaPuesta) return;

      this.seleccion.set(inicial);
      this.dibujarPin(inicial, true);
    });
  }

  async ngAfterViewInit(): Promise<void> {
    try {
      await this.loader.cargar();

      const inicial = this.valorInicial();
      this.mapa = new google.maps.Map(this.contenedorMapa().nativeElement, {
        center: inicial ? { lat: inicial.lat, lng: inicial.lng } : CENTRO_POR_DEFECTO,
        zoom: inicial ? 16 : 12,
        mapTypeControl: false,
        streetViewControl: false,
      });

      // Click en cualquier punto del mapa: coloca (o mueve) el pin ahí.
      this.mapa.addListener('click', (evento: google.maps.MapMouseEvent) => {
        if (evento.latLng) this.fijarPunto(evento.latLng.toJSON());
      });

      if (inicial) {
        this.seleccion.set(inicial);
        this.dibujarPin(inicial, false);
      }

      this.estado.set('listo');
      await this.prepararBuscador();
    } catch (error) {
      this.estado.set(error === 'SIN_API_KEY' ? 'sin-key' : 'error');
    }
  }

  /** Monta el buscador de direcciones de Google dentro del formulario. */
  private async prepararBuscador(): Promise<void> {
    try {
      await this.loader.cargarLibreria('places');

      const buscador = new google.maps.places.PlaceAutocompleteElement({
        includedRegionCodes: ['ar'],
      });
      this.contenedorBuscador().nativeElement.appendChild(buscador);

      buscador.addEventListener('gmp-select', async (evento: Event) => {
        const { placePrediction } =
          evento as unknown as google.maps.places.PlacePredictionSelectEvent;

        const lugar = placePrediction.toPlace();
        await lugar.fetchFields({ fields: ['location', 'formattedAddress'] });

        if (!lugar.location) return;
        this.fijarPunto(lugar.location.toJSON(), lugar.formattedAddress ?? '');
      });
    } catch {
      // Sin Places la pantalla sigue siendo usable: se marca el punto a mano.
      this.buscadorDisponible.set(false);
    }
  }

  /** Fija el punto elegido y avisa al formulario. */
  private fijarPunto(posicion: google.maps.LatLngLiteral, direccion?: string): void {
    const ubicacion: Ubicacion = {
      lat: posicion.lat,
      lng: posicion.lng,
      direccion: direccion ?? this.seleccion()?.direccion ?? '',
    };

    this.seleccion.set(ubicacion);
    this.dibujarPin(ubicacion, true);
    this.ubicacionCambiada.emit(ubicacion);

    // Si no vino una dirección (click o arrastre), se la pedimos a Google.
    if (direccion === undefined) this.completarDireccion(ubicacion);
  }

  /** Traduce las coordenadas a una dirección legible. Si falla, quedan las coordenadas. */
  private async completarDireccion(ubicacion: Ubicacion): Promise<void> {
    try {
      await this.loader.cargarLibreria('geocoding');
      this.geocoder ??= new google.maps.Geocoder();

      const { results } = await this.geocoder.geocode({
        location: { lat: ubicacion.lat, lng: ubicacion.lng },
      });
      const direccion = results[0]?.formatted_address;
      if (!direccion) return;

      const actualizada: Ubicacion = { ...ubicacion, direccion };
      this.seleccion.set(actualizada);
      this.ubicacionCambiada.emit(actualizada);
    } catch {
      // Sin Geocoding el punto igual queda guardado, sólo sin texto de dirección.
    }
  }

  /** Dibuja o mueve el pin arrastrable. */
  private dibujarPin(ubicacion: Ubicacion, recentrar: boolean): void {
    if (!this.mapa) return;
    const posicion = { lat: ubicacion.lat, lng: ubicacion.lng };

    if (!this.marcador) {
      this.marcador = new google.maps.Marker({
        map: this.mapa,
        position: posicion,
        draggable: true,
      });
      this.marcador.addListener('dragend', (evento: google.maps.MapMouseEvent) => {
        if (evento.latLng) this.fijarPunto(evento.latLng.toJSON());
      });
    } else {
      this.marcador.setPosition(posicion);
    }

    if (recentrar) this.mapa.panTo(posicion);
  }

  /** Quita la ubicación del evento. */
  protected limpiar(): void {
    this.seleccion.set(null);
    this.marcador?.setMap(null);
    this.marcador = undefined;
    this.ubicacionCambiada.emit(null);
  }
}

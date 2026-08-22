import { Injectable } from '@angular/core';
import { GOOGLE_MAPS_API_KEY } from '../config/google-maps.config';

/** Motivos por los que el mapa puede no llegar a cargarse. */
export type ErrorMapa = 'SIN_API_KEY' | 'ERROR_DE_CARGA';

/** Librerías del SDK que usa la app. Se piden todas juntas al cargar el script. */
const LIBRERIAS = ['places', 'marker', 'geocoding'] as const;

/** Librerías cuya disponibilidad se verifica desde los componentes. */
export type LibreriaMapa = 'places' | 'geocoding';

/** Nombre de la función global que el SDK invoca cuando terminó de inicializarse. */
const CALLBACK_GLOBAL = '__alltickets_google_maps_listo';

/**
 * Carga el script de Google Maps una sola vez para toda la aplicación.
 *
 * Se inyecta bajo demanda (no en el index.html) para que las pantallas que
 * no usan el mapa no paguen la descarga, y para que la app siga funcionando
 * con normalidad aunque la API key no esté configurada.
 */
@Injectable({ providedIn: 'root' })
export class GoogleMapsLoader {
  private carga?: Promise<void>;

  /** Resuelve cuando `google.maps` está listo para usarse. Rechaza con un `ErrorMapa`. */
  cargar(): Promise<void> {
    // La promesa se cachea: si dos componentes piden el mapa a la vez,
    // el script se inyecta una única vez.
    this.carga ??= this.inyectarScript();
    return this.carga;
  }

  /**
   * Espera a que esté disponible una librería puntual del SDK.
   * Las librerías vienen todas en la URL del script, así que esto sólo verifica
   * que la que necesitamos haya quedado efectivamente cargada.
   */
  async cargarLibreria(nombre: LibreriaMapa): Promise<void> {
    await this.cargar();

    const disponible =
      nombre === 'places'
        ? typeof google.maps.places?.PlaceAutocompleteElement === 'function'
        : typeof google.maps.Geocoder === 'function';

    if (!disponible) throw 'ERROR_DE_CARGA' satisfies ErrorMapa;
  }

  private inyectarScript(): Promise<void> {
    if (!GOOGLE_MAPS_API_KEY) {
      return Promise.reject('SIN_API_KEY' satisfies ErrorMapa);
    }

    return new Promise<void>((resolve, reject) => {
      // Si el script ya está en el DOM (por ejemplo tras una recarga en caliente)
      // y el SDK quedó listo, no hace falta volver a inyectarlo.
      if (typeof google !== 'undefined' && typeof google.maps?.Map === 'function') {
        resolve();
        return;
      }

      // El SDK avisa que terminó de inicializarse llamando a esta función global.
      // Usamos `callback` (y no el onload del script) porque con `loading=async`
      // el onload dispara antes de que `google.maps` esté realmente usable.
      Reflect.set(window, CALLBACK_GLOBAL, () => {
        Reflect.deleteProperty(window, CALLBACK_GLOBAL);
        resolve();
      });

      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.async = true;
      script.src =
        'https://maps.googleapis.com/maps/api/js' +
        `?key=${GOOGLE_MAPS_API_KEY}` +
        `&libraries=${LIBRERIAS.join(',')}` +
        `&callback=${CALLBACK_GLOBAL}` +
        '&loading=async' +
        '&language=es' +
        '&region=AR';
      script.onerror = () => reject('ERROR_DE_CARGA' satisfies ErrorMapa);
      document.head.appendChild(script);
    });
  }
}
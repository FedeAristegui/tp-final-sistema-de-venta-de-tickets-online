import { Injectable } from '@angular/core';
import { GOOGLE_MAPS_API_KEY } from '../config/google-maps.config';

export type ErrorMapa = 'SIN_API_KEY' | 'ERROR_DE_CARGA';

const LIBRERIAS = ['places', 'marker', 'geocoding'] as const;

export type LibreriaMapa = 'places' | 'geocoding';

const CALLBACK_GLOBAL = '__alltickets_google_maps_listo';

@Injectable({ providedIn: 'root' })
export class GoogleMapsLoader {
  private carga?: Promise<void>;

  cargar(): Promise<void> {
    this.carga ??= this.inyectarScript();
    return this.carga;
  }

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
      if (typeof google !== 'undefined' && typeof google.maps?.Map === 'function') {
        resolve();
        return;
      }

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
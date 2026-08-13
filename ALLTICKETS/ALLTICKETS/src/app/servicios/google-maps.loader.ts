import { Injectable } from '@angular/core';
import { GOOGLE_MAPS_API_KEY } from '../config/google-maps.config';

/** Motivos por los que el mapa puede no llegar a cargarse. */
export type ErrorMapa = 'SIN_API_KEY' | 'ERROR_DE_CARGA';

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

  /** Resuelve cuando `google.maps` está listo para dibujar mapas. Rechaza con un `ErrorMapa`. */
  cargar(): Promise<void> {
    // La promesa se cachea: si dos componentes piden el mapa a la vez,
    // el script se inyecta una única vez.
    this.carga ??= this.inyectarScript();
    return this.carga;
  }

  /**
   * Carga una librería adicional del SDK.
   * 'places' es la del buscador de direcciones y 'geocoding' la que traduce
   * coordenadas a una dirección legible cuando el admin mueve el pin.
   */
  async cargarLibreria(nombre: 'places' | 'geocoding'): Promise<void> {
    await this.cargar();
    try {
      await google.maps.importLibrary(nombre);
    } catch {
      throw 'ERROR_DE_CARGA' satisfies ErrorMapa;
    }
  }

  private async inyectarScript(): Promise<void> {
    if (!GOOGLE_MAPS_API_KEY) {
      throw 'SIN_API_KEY' satisfies ErrorMapa;
    }

    // Si el script ya está en el DOM (por ejemplo tras un recarga en caliente), lo reutilizamos.
    if (!document.getElementById('google-maps-script')) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.async = true;
        script.src =
          'https://maps.googleapis.com/maps/api/js' +
          `?key=${GOOGLE_MAPS_API_KEY}` +
          '&loading=async' +
          '&language=es' +
          '&region=AR';
        script.onload = () => resolve();
        script.onerror = () => reject('ERROR_DE_CARGA' satisfies ErrorMapa);
        document.head.appendChild(script);
      });
    }

    // Con `loading=async` el script sólo deja lista la función `importLibrary`,
    // así que hay que pedir explícitamente la librería que vamos a usar.
    try {
      await google.maps.importLibrary('maps');
    } catch {
      throw 'ERROR_DE_CARGA' satisfies ErrorMapa;
    }
  }
}

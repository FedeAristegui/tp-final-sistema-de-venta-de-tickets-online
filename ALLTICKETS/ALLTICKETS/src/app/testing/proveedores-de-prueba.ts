import { EnvironmentProviders, Provider, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

/**
 * Proveedores mínimos que necesita cualquier prueba de esta app.
 *
 * - `provideZonelessChangeDetection`: la app corre sin Zone.js (ver app.config.ts),
 *   así que las pruebas tienen que configurarse igual. Sin esto, TestBed asume el
 *   modo clásico y falla con NG0908.
 * - `provideRouter` con una ruta comodín: varios componentes navegan apenas se
 *   crean (por ejemplo al no encontrar un usuario logueado) y sin rutas la
 *   navegación fallaría.
 * - `provideHttpClientTesting`: intercepta los pedidos para que ninguna prueba
 *   salga a la red de verdad.
 */
export function proveedoresDePrueba(): (Provider | EnvironmentProviders)[] {
  return [
    provideZonelessChangeDetection(),
    provideRouter([{ path: '**', children: [] }]),
    provideHttpClient(),
    provideHttpClientTesting()
  ];
}

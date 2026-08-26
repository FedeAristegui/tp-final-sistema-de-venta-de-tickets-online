import { EnvironmentProviders, Provider, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

export function proveedoresDePrueba(): (Provider | EnvironmentProviders)[] {
  return [
    provideZonelessChangeDetection(),
    provideRouter([{ path: '**', children: [] }]),
    provideHttpClient(),
    provideHttpClientTesting()
  ];
}

import { TestBed } from '@angular/core/testing';

import { EventoServicio } from './evento.servicio';
import { proveedoresDePrueba } from '../testing/proveedores-de-prueba';

describe('EventoServicio', () => {
  let service: EventoServicio;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: proveedoresDePrueba()
    });
    service = TestBed.inject(EventoServicio);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { Autenticador } from '../servicios/autenticador';
import { proveedoresDePrueba } from '../testing/proveedores-de-prueba';

describe('Autenticador', () => {
  let service: Autenticador;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: proveedoresDePrueba()
    });
    service = TestBed.inject(Autenticador);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

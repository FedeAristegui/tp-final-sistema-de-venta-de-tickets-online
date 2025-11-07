import { TestBed } from '@angular/core/testing';

import { Autenticador } from './servicios/autenticador';

describe('Autenticador', () => {
  let service: Autenticador;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Autenticador);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

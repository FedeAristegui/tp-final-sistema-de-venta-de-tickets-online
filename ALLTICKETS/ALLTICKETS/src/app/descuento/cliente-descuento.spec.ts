import { TestBed } from '@angular/core/testing';

import { ClienteDescuento } from './cliente-descuento';

describe('ClienteDescuento', () => {
  let service: ClienteDescuento;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClienteDescuento);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

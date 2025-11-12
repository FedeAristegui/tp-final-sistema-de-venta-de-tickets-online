import { TestBed } from '@angular/core/testing';

import { AlmacenDescuento } from './almacen-descuento';

describe('AlmacenDescuento', () => {
  let service: AlmacenDescuento;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AlmacenDescuento);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

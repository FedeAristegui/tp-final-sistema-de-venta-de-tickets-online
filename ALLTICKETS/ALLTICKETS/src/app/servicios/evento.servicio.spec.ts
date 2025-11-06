import { TestBed } from '@angular/core/testing';

import { EventoServicio } from './evento.servicio';

describe('EventoServicio', () => {
  let service: EventoServicio;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EventoServicio);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

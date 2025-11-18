import { ComponentFixture, TestBed } from '@angular/core/testing';

import { detalleEvento } from './detalle-evento';

describe('detalleEvento', () => {
  let component: detalleEvento;
  let fixture: ComponentFixture<detalleEvento>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [detalleEvento]
    })
    .compileComponents();

    fixture = TestBed.createComponent(detalleEvento);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

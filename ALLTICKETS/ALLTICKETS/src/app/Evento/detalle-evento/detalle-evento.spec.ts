import { ComponentFixture, TestBed } from '@angular/core/testing';

import { detalleEvento } from './detalle-evento';
import { proveedoresDePrueba } from '../../testing/proveedores-de-prueba';

describe('detalleEvento', () => {
  let component: detalleEvento;
  let fixture: ComponentFixture<detalleEvento>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [detalleEvento],
      providers: proveedoresDePrueba()
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

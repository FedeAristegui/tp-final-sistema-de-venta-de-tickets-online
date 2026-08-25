import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalleDescuento } from './detalle-descuento';
import { proveedoresDePrueba } from '../../testing/proveedores-de-prueba';

describe('DetalleDescuento', () => {
  let component: DetalleDescuento;
  let fixture: ComponentFixture<DetalleDescuento>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalleDescuento],
      providers: proveedoresDePrueba()
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetalleDescuento);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

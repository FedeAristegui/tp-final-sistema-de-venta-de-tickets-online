import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormularioDescuento } from './formulario-descuento';
import { proveedoresDePrueba } from '../../testing/proveedores-de-prueba';

describe('FormularioDescuento', () => {
  let component: FormularioDescuento;
  let fixture: ComponentFixture<FormularioDescuento>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormularioDescuento],
      providers: proveedoresDePrueba()
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormularioDescuento);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

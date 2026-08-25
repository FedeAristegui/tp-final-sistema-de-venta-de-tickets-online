import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistorialCompras } from './historial-compras';
import { proveedoresDePrueba } from '../testing/proveedores-de-prueba';

describe('HistorialCompras', () => {
  let component: HistorialCompras;
  let fixture: ComponentFixture<HistorialCompras>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistorialCompras],
      providers: proveedoresDePrueba()
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistorialCompras);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

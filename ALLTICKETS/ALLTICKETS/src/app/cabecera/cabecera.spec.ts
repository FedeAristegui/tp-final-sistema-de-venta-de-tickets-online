import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Cabecera } from './cabecera';
import { proveedoresDePrueba } from '../testing/proveedores-de-prueba';

describe('Cabecera', () => {
  let component: Cabecera;
  let fixture: ComponentFixture<Cabecera>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Cabecera],
      providers: proveedoresDePrueba()
    })
    .compileComponents();

    fixture = TestBed.createComponent(Cabecera);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

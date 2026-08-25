import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IniciarSesion } from './iniciar-sesion';
import { proveedoresDePrueba } from '../testing/proveedores-de-prueba';

describe('IniciarSesion', () => {
  let component: IniciarSesion;
  let fixture: ComponentFixture<IniciarSesion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IniciarSesion],
      providers: proveedoresDePrueba()
    })
    .compileComponents();

    fixture = TestBed.createComponent(IniciarSesion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

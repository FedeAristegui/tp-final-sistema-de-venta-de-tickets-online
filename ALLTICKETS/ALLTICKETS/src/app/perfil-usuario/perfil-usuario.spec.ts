import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PerfilUsuario } from './perfil-usuario';
import { proveedoresDePrueba } from '../testing/proveedores-de-prueba';

describe('PerfilUsuario', () => {
  let component: PerfilUsuario;
  let fixture: ComponentFixture<PerfilUsuario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerfilUsuario],
      providers: proveedoresDePrueba()
    })
    .compileComponents();

    fixture = TestBed.createComponent(PerfilUsuario);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

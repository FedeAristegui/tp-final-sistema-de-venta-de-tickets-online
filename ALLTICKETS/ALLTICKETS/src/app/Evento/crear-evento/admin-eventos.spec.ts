import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminEventos } from './admin-eventos';
import { proveedoresDePrueba } from '../../testing/proveedores-de-prueba';

describe('AdminEventos', () => {
  let component: AdminEventos;
  let fixture: ComponentFixture<AdminEventos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminEventos],
      providers: proveedoresDePrueba()
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminEventos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

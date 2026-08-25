import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaEvento } from './lista-evento';
import { proveedoresDePrueba } from '../../testing/proveedores-de-prueba';

describe('ListaEvento', () => {
  let component: ListaEvento;
  let fixture: ComponentFixture<ListaEvento>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaEvento],
      providers: proveedoresDePrueba()
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaEvento);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

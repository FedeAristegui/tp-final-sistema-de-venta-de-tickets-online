import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaDescuento } from './lista-descuento';

describe('ListaDescuento', () => {
  let component: ListaDescuento;
  let fixture: ComponentFixture<ListaDescuento>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaDescuento]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaDescuento);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaEvento } from './lista-evento';

describe('ListaEvento', () => {
  let component: ListaEvento;
  let fixture: ComponentFixture<ListaEvento>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaEvento]
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

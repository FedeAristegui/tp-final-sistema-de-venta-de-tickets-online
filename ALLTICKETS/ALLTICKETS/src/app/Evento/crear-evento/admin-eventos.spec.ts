import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminEventos } from './admin-eventos';

describe('AdminEventos', () => {
  let component: AdminEventos;
  let fixture: ComponentFixture<AdminEventos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminEventos]
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

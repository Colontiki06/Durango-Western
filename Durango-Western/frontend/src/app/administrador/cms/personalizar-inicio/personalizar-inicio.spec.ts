import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonalizarInicio } from './personalizar-inicio';

describe('PersonalizarInicio', () => {
  let component: PersonalizarInicio;
  let fixture: ComponentFixture<PersonalizarInicio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonalizarInicio],
    }).compileComponents();

    fixture = TestBed.createComponent(PersonalizarInicio);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

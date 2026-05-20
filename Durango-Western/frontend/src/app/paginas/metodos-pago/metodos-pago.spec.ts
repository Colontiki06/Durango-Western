import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetodosPago } from './metodos-pago';

describe('MetodosPago', () => {
  let component: MetodosPago;
  let fixture: ComponentFixture<MetodosPago>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetodosPago],
    }).compileComponents();

    fixture = TestBed.createComponent(MetodosPago);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

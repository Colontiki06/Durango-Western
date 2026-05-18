import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmacionCompra } from './confirmacion-compra';

describe('ConfirmacionCompra', () => {
  let component: ConfirmacionCompra;
  let fixture: ComponentFixture<ConfirmacionCompra>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmacionCompra],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmacionCompra);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

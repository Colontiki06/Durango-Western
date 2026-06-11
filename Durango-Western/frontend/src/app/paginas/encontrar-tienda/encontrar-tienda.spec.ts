import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EncontrarTienda } from './encontrar-tienda';

describe('EncontrarTienda', () => {
  let component: EncontrarTienda;
  let fixture: ComponentFixture<EncontrarTienda>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EncontrarTienda],
    }).compileComponents();

    fixture = TestBed.createComponent(EncontrarTienda);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

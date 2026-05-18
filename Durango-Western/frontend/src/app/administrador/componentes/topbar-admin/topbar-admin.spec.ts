import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopbarAdmin } from './topbar-admin';

describe('TopbarAdmin', () => {
  let component: TopbarAdmin;
  let fixture: ComponentFixture<TopbarAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopbarAdmin],
    }).compileComponents();

    fixture = TestBed.createComponent(TopbarAdmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

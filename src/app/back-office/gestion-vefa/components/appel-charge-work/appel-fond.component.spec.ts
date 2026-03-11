import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppelChargeWorkComponent } from './appel-fond.component';

describe('AppelChargeWorkComponent', () => {
  let component: AppelChargeWorkComponent;
  let fixture: ComponentFixture<AppelChargeWorkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppelChargeWorkComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AppelChargeWorkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

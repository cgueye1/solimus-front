import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrescriptionPaymentComponent } from './prescription-payment.component';

describe('PrescriptionPaymentComponent', () => {
  let component: PrescriptionPaymentComponent;
  let fixture: ComponentFixture<PrescriptionPaymentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrescriptionPaymentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrescriptionPaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

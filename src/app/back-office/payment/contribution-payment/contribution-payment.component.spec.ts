import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContributionPaymentComponent } from './contribution-payment.component';

describe('ContributionPaymentComponent', () => {
  let component: ContributionPaymentComponent;
  let fixture: ComponentFixture<ContributionPaymentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContributionPaymentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContributionPaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

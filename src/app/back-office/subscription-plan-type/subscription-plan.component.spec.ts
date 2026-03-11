import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubscriptionPlanTypeComponent} from './subscription-plan-type.component';

describe('SubscriptionPlanTypeComponent', () => {
  let component: SubscriptionPlanTypeComponent;
  let fixture: ComponentFixture<SubscriptionPlanTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubscriptionPlanTypeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SubscriptionPlanTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaletDeliveryComponent } from './walet-delivery.component';

describe('WaletDeliveryComponent', () => {
  let component: WaletDeliveryComponent;
  let fixture: ComponentFixture<WaletDeliveryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WaletDeliveryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WaletDeliveryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

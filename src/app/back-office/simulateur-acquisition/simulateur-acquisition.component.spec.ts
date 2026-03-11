import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimulateurAcquisitionComponent } from './simulateur-acquisition.component';

describe('SimulateurAcquisitionComponent', () => {
  let component: SimulateurAcquisitionComponent;
  let fixture: ComponentFixture<SimulateurAcquisitionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SimulateurAcquisitionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SimulateurAcquisitionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

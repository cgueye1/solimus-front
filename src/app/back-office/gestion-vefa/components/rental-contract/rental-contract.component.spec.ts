import { ComponentFixture, TestBed } from '@angular/core/testing';

import {  RentalContractComponent } from './rental-contract.component';

describe(' RentalContractComponent', () => {
  let component:  RentalContractComponent;
  let fixture: ComponentFixture< RentalContractComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ RentalContractComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent( RentalContractComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

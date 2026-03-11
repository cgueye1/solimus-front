import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardLotSelectionComponent } from './card-lot-selection.component';

describe('CardLotSelectionComponent', () => {
  let component: CardLotSelectionComponent;
  let fixture: ComponentFixture<CardLotSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardLotSelectionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CardLotSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

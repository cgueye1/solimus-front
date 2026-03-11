import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardLotComponent } from './card-lot.component';

describe('CardLotComponent', () => {
  let component: CardLotComponent;
  let fixture: ComponentFixture<CardLotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardLotComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CardLotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

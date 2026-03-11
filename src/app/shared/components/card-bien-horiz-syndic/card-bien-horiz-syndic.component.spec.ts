import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardBienHorizSyndicComponent } from './card-bien-horiz-syndic.component';

describe('CardBienHorizSyndicComponent', () => {
  let component: CardBienHorizSyndicComponent;
  let fixture: ComponentFixture<CardBienHorizSyndicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardBienHorizSyndicComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CardBienHorizSyndicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

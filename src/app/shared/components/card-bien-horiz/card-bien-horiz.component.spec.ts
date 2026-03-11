import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardBienHorizComponent } from './card-bien-horiz.component';

describe('CardBienHorizComponent', () => {
  let component: CardBienHorizComponent;
  let fixture: ComponentFixture<CardBienHorizComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardBienHorizComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CardBienHorizComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

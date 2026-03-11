import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardBienVerticalComponent } from './card-bien-vertical.component';



describe('CardBienVerticalComponent', () => {
  let component: CardBienVerticalComponent;
  let fixture: ComponentFixture<CardBienVerticalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardBienVerticalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardBienVerticalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservataireComponent } from './reservataire.component';

describe('ReservataireComponent', () => {
  let component: ReservataireComponent;
  let fixture: ComponentFixture<ReservataireComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservataireComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReservataireComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

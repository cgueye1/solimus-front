import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllBienComponent } from './all-bien.component';

describe('AllBienComponent', () => {
  let component: AllBienComponent;
  let fixture: ComponentFixture<AllBienComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllBienComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllBienComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

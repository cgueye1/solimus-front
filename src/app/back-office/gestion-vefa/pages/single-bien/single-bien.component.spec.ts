import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SingleBienComponent } from './single-bien.component';

describe('SingleBienComponent', () => {
  let component: SingleBienComponent;
  let fixture: ComponentFixture<SingleBienComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SingleBienComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SingleBienComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

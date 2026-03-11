import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateBienComponent } from './create-bien.component';

describe('CreateBienComponent', () => {
  let component: CreateBienComponent;
  let fixture: ComponentFixture<CreateBienComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateBienComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreateBienComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateBienSyndicComponent } from './create-bien-syndic.component';

describe('CreateBienSyndicComponent', () => {
  let component: CreateBienSyndicComponent;
  let fixture: ComponentFixture<CreateBienSyndicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateBienSyndicComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreateBienSyndicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

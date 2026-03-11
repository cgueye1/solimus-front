import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppelFondFormComponent } from './appel-fond-form.component';

describe('AppelFondFormComponent', () => {
  let component: AppelFondFormComponent;
  let fixture: ComponentFixture<AppelFondFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppelFondFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AppelFondFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

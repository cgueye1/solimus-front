import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppelFondComponent } from './appel-fond.component';

describe('AppelFondComponent', () => {
  let component: AppelFondComponent;
  let fixture: ComponentFixture<AppelFondComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppelFondComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AppelFondComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

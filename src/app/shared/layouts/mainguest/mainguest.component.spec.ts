import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainguestComponent } from './mainguest.component';

describe('MainguestComponent', () => {
  let component: MainguestComponent;
  let fixture: ComponentFixture<MainguestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainguestComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MainguestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

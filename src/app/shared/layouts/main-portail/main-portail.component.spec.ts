import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainPortailComponent } from './main-portail.component';

describe('MainPortailComponent', () => {
  let component: MainPortailComponent;
  let fixture: ComponentFixture<MainPortailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainPortailComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MainPortailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

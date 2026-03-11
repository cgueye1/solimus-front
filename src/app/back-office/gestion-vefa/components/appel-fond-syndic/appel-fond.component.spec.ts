import { ComponentFixture, TestBed } from '@angular/core/testing';

import {  AppelFondSyndicComponent } from './appel-fond.component';

describe(' AppelFondSyndicComponent', () => {
  let component:  AppelFondSyndicComponent;
  let fixture: ComponentFixture< AppelFondSyndicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ AppelFondSyndicComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent( AppelFondSyndicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

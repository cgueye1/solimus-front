import { ComponentFixture, TestBed } from '@angular/core/testing';

import {  AvisEcheanceComponent } from './avis-echeance.component';

describe(' AvisEcheanceComponent', () => {
  let component:  AvisEcheanceComponent;
  let fixture: ComponentFixture< AvisEcheanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ AvisEcheanceComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent( AvisEcheanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

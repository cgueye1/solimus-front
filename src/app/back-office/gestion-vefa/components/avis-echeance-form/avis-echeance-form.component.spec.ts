import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvisEcheanceFormComponent } from './avis-echeance-form.component';

describe('AvisEcheanceFormComponent', () => {
  let component: AvisEcheanceFormComponent;
  let fixture: ComponentFixture<AvisEcheanceFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvisEcheanceFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AvisEcheanceFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

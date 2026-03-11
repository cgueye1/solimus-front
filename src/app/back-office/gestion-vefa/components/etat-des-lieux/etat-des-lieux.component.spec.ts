import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EtatDesLieuxComponent } from './etat-des-lieux.component';

describe('EtatDesLieuxComponent', () => {
  let component: EtatDesLieuxComponent;
  let fixture: ComponentFixture<EtatDesLieuxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EtatDesLieuxComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EtatDesLieuxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

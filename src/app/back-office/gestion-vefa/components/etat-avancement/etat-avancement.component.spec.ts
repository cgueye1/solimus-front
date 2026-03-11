import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EtatAvancementComponent } from './etat-avancement.component';

describe('EtatAvancementComponent', () => {
  let component: EtatAvancementComponent;
  let fixture: ComponentFixture<EtatAvancementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EtatAvancementComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EtatAvancementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

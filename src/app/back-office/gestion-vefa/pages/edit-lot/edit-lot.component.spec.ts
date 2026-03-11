import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditLotComponent } from './edit-lot.component';

describe('EditLotComponent', () => {
  let component: EditLotComponent;
  let fixture: ComponentFixture<EditLotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditLotComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EditLotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

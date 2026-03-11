import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditBienComponent } from './edit-bien.component';

describe('EditBienComponent', () => {
  let component: EditBienComponent;
  let fixture: ComponentFixture<EditBienComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditBienComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EditBienComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

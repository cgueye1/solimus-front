import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeetManagementComponent } from './syndic-meet.component';

describe('MeetManagementComponent', () => {
  let component: MeetManagementComponent;
  let fixture: ComponentFixture<MeetManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MeetManagementComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MeetManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupDetailBienComponent } from './popup-detail-bien.component';

describe('PopupDetailBienComponent', () => {
  let component: PopupDetailBienComponent;
  let fixture: ComponentFixture<PopupDetailBienComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopupDetailBienComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PopupDetailBienComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

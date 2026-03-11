import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailLotComponent } from './detail-lot.component';

describe('DetailLotComponent', () => {
  let component: DetailLotComponent;
  let fixture: ComponentFixture<DetailLotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailLotComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DetailLotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

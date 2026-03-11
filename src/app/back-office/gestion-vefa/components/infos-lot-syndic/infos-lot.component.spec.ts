import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfosLotComponent } from './infos-lot.component';

describe('InfosLotComponent', () => {
  let component: InfosLotComponent;
  let fixture: ComponentFixture<InfosLotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfosLotComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InfosLotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

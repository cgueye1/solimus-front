import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfosPersComponent } from './infos-pers.component';

describe('InfosPersComponent', () => {
  let component: InfosPersComponent;
  let fixture: ComponentFixture<InfosPersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfosPersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InfosPersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailSyndicComponent } from './detail-syndic.component';

describe('DetailSyndicComponent', () => {
  let component: DetailSyndicComponent;
  let fixture: ComponentFixture<DetailSyndicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailSyndicComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DetailSyndicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

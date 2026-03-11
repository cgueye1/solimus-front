import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListBienSyndicComponent } from './list-bien-syndic.component';

describe('ListBienSyndicComponent', () => {
  let component: ListBienSyndicComponent
  let fixture: ComponentFixture<ListBienSyndicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListBienSyndicComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ListBienSyndicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

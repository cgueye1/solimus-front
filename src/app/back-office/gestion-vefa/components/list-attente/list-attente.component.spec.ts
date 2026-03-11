import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListAttenteComponent } from './list-attente.component';

describe('ListAttenteComponent', () => {
  let component: ListAttenteComponent;
  let fixture: ComponentFixture<ListAttenteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListAttenteComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ListAttenteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

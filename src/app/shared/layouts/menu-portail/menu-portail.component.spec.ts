import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuPortailComponent } from './menu-portail.component';

describe('MenuPortailComponent', () => {
  let component: MenuPortailComponent;
  let fixture: ComponentFixture<MenuPortailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuPortailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MenuPortailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

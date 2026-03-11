import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManifestantListComponent } from './manifestant-list.component';

describe('ManifestantListComponent', () => {
  let component: ManifestantListComponent;
  let fixture: ComponentFixture<ManifestantListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManifestantListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManifestantListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

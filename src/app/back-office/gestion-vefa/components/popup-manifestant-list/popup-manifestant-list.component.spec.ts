import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupManifestantListComponent } from './popup-manifestant-list.component';

describe('PopupManifestantListComponent', () => {
  let component: PopupManifestantListComponent;
  let fixture: ComponentFixture<PopupManifestantListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopupManifestantListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PopupManifestantListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

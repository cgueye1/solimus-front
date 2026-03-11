import { TestBed } from '@angular/core/testing';

import { ProfileThemeService } from './profile-theme.service';

describe('ProfileThemeService', () => {
  let service: ProfileThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProfileThemeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

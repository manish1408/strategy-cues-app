import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PricelabsAdminComponent } from './pricelabs-admin.component';

describe('PricelabsAdminComponent', () => {
  let component: PricelabsAdminComponent;
  let fixture: ComponentFixture<PricelabsAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PricelabsAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PricelabsAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

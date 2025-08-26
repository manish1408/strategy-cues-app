import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PhoneDropdownMiloComponent } from './phone-dropdown-milo.component';

describe('PhoneDropdownMiloComponent', () => {
  let component: PhoneDropdownMiloComponent;
  let fixture: ComponentFixture<PhoneDropdownMiloComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PhoneDropdownMiloComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PhoneDropdownMiloComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

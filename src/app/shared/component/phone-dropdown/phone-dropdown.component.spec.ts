import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PhoneDropdownComponent } from './phone-dropdown.component';

describe('PhoneDropdownComponent', () => {
  let component: PhoneDropdownComponent;
  let fixture: ComponentFixture<PhoneDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PhoneDropdownComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PhoneDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

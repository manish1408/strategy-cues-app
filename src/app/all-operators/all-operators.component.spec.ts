import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllOperatorsComponent } from './all-operators.component';

describe('AllOperatorsComponent', () => {
  let component: AllOperatorsComponent;
  let fixture: ComponentFixture<AllOperatorsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AllOperatorsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllOperatorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

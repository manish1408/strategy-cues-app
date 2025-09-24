import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AmenitiesAnalyzerComponent } from './amenities-analyzer.component';

describe('AmenitiesAnalyzerComponent', () => {
  let component: AmenitiesAnalyzerComponent;
  let fixture: ComponentFixture<AmenitiesAnalyzerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AmenitiesAnalyzerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AmenitiesAnalyzerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

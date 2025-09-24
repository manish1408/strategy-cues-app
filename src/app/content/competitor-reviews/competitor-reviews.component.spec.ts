import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompetitorReviewsComponent } from './competitor-reviews.component';

describe('CompetitorReviewsComponent', () => {
  let component: CompetitorReviewsComponent;
  let fixture: ComponentFixture<CompetitorReviewsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CompetitorReviewsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompetitorReviewsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

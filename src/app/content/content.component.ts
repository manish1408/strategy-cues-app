import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-content',
  templateUrl: './content.component.html',
  styleUrl: './content.component.scss',
})
export class ContentComponent implements OnInit {
  activeTab: string = 'photos';

  constructor() { }

  ngOnInit(): void {
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  // Competitor carousel navigation methods
  previousCompetitor(): void {
    // Logic to navigate to previous competitor
    console.log('Previous competitor');
  }

  nextCompetitor(): void {
    // Logic to navigate to next competitor
    console.log('Next competitor');
  }

}

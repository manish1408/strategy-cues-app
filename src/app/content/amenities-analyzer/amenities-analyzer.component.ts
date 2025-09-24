import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-amenities-analyzer',
  templateUrl: './amenities-analyzer.component.html',
  styleUrls: ['./amenities-analyzer.component.scss']
})
export class AmenitiesAnalyzerComponent implements OnInit {
  
  // Ranking & Conversion Boosters Data
  rankingBoosters = [
    { name: 'Room-darkening shades', has: true },
    { name: 'Private entrance', has: true },
    { name: 'Body soap', has: true },
    { name: 'Toaster', has: true },
    { name: 'Iron', has: true },
    { name: 'Patio or balcony', has: true },
    { name: 'Cooking basics', has: true },
    { name: 'Freezer', has: true },
    { name: 'Free street parking', has: false },
    { name: 'Pack \'n Play/travel crib', has: false },
    { name: 'Pets allowed', has: false },
    { name: 'Long term stays allowed', has: false },
    { name: 'Ceiling fan', has: false },
    { name: 'Barbecue utensils', has: false },
    { name: 'Laundromat nearby', has: false },
    { name: 'Private living room', has: false }
  ];

  // Top Ranking Amenities in Your Area
  topRankingAmenities = [
    'Microwave',
    'Coffee maker',
    'Outdoor Dining Area',
    'Outdoor seating',
    'Sun loungers',
    'Kitchenette',
    'Alfresco shower',
    'Bidet',
    'Hot tub',
    'Cleaning before checkout',
    'Nespresso machine',
    'BBQ grill',
    'Waterfront',
    'Paid parking off premises',
    'Keypad',
    'Smart lock',
    'Baking sheet',
    'Books',
    'Beach access',
    'Lock on bedroom door',
    'Paid parking on premises',
    'Host greets you',
    'Mini fridge',
    'High chair',
    'Garden or backyard',
    'Blender',
    'Lake access',
    'Resort access',
    'Sound system',
    'Pool table'
  ];

  // Notifications
  notificationSettings = {
    amenityMissing: false
  };

  constructor() { }

  ngOnInit(): void {
  }

  toggleNotification(setting: string): void {
    (this.notificationSettings as any)[setting] = !(this.notificationSettings as any)[setting];
  }
}

import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-my-reviews',
  templateUrl: './my-reviews.component.html',
  styleUrls: ['./my-reviews.component.scss']
})
export class MyReviewsComponent implements OnInit {
  reportDate: string = 'Sep 01, 2025';
  totalReviews: number = 45; // Example number for your own reviews
  
  // My Reviews Data
  myDislikes = [
    {
      title: 'Limited Amenities',
      description: 'Some guests mentioned the lack of certain amenities compared to competitors.'
    },
    {
      title: 'Check-in Process',
      description: 'Guests found the check-in process somewhat complicated and time-consuming.'
    },
    {
      title: 'Wi-Fi Connectivity',
      description: 'Some guests experienced Wi-Fi connectivity issues in certain areas of the property.'
    }
  ];

  myWishes = [
    {
      title: 'More Entertainment Options',
      description: 'Guests would like to see more entertainment options in the property.'
    },
    {
      title: 'Better Wi-Fi Coverage',
      description: 'Some guests experienced Wi-Fi connectivity issues in certain areas.'
    },
    {
      title: 'Additional Kitchen Appliances',
      description: 'Guests requested more kitchen appliances for extended stays.'
    }
  ];

  myLoves = [
    {
      title: 'Excellent Customer Service',
      description: 'Guests consistently praised the responsive and helpful customer service.'
    },
    {
      title: 'Prime Location',
      description: 'The central location and easy access to attractions were highly appreciated.'
    },
    {
      title: 'Clean and Well-Maintained',
      description: 'Guests loved the cleanliness and overall maintenance of the property.'
    },
    {
      title: 'Value for Money',
      description: 'Many guests appreciated the competitive pricing and value offered.'
    }
  ];

  myActionableChanges = [
    {
      title: 'Add More Amenities',
      description: 'Consider adding amenities that competitors offer to stay competitive.'
    },
    {
      title: 'Streamline Check-in',
      description: 'Simplify the check-in process to improve guest experience.'
    },
    {
      title: 'Improve Wi-Fi Infrastructure',
      description: 'Upgrade Wi-Fi equipment to ensure better coverage throughout the property.'
    },
    {
      title: 'Enhance Entertainment Options',
      description: 'Add more entertainment features to meet guest expectations.'
    }
  ];

  constructor() { }

  ngOnInit(): void {
  }
}

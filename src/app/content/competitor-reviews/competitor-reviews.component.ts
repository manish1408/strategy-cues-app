import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-competitor-reviews',
  templateUrl: './competitor-reviews.component.html',
  styleUrls: ['./competitor-reviews.component.scss']
})
export class CompetitorReviewsComponent implements OnInit {
  reportDate: string = 'Sep 01, 2025';
  totalReviews: number = 130;
  
  // Competitor Reviews Data
  competitorDislikes = [
    {
      title: 'Noise Issues',
      description: 'Guests reported noise from nearby bars, outdoor music, a busy street, and ongoing construction, making it difficult to sleep.'
    },
    {
      title: 'Air Conditioning Problems',
      description: 'Issues with malfunctioning air conditioning units and unpleasant odors were noted by guests.'
    },
    {
      title: 'Parking Difficulties',
      description: 'Guests experienced challenges with parking access, including slow valet service and issues with lost access cards.'
    },
    {
      title: 'Cleanliness Concerns',
      description: 'Some guests mentioned cleanliness issues, including dirty bathrooms and pest problems.'
    },
    {
      title: 'High Additional Charges',
      description: 'Guests expressed dissatisfaction with high additional charges for cleaning services and overall pricing, feeling the apartment was overpriced!'
    }
  ];

  competitorWishes = [
    {
      title: 'Improved Lighting',
      description: 'Guests wished for more lighting in the living area.'
    },
    {
      title: 'Smart TV Availability',
      description: 'A desire for a smart TV instead of cable connection was expressed.'
    },
    {
      title: 'Better Communication',
      description: 'Guests wanted clearer communication regarding cleaning services and check-in processes.'
    },
    {
      title: 'Moderate Pricing',
      description: 'Some guests wished for a more moderate price point to enhance value.'
    },
    {
      title: 'Clearer Transportation Instructions',
      description: 'Guests requested clearer instructions for Ubers to find the building due to confusion with similar buildings in the area.'
    }
  ];

  competitorLoves = [
    {
      title: 'Clean and Comfortable Apartments',
      description: 'Guests loved the cleanliness, comfort, and well-equipped nature of the apartments.'
    },
    {
      title: 'Exceptional Hospitality',
      description: 'Many guests appreciated the exceptional hospitality and responsiveness from hosts, particularly Mr. Jafar.'
    },
    {
      title: 'Great Location and Views',
      description: 'Guests enjoyed the beautiful views and great locations, often close to major attractions like Dubai Mall.'
    },
    {
      title: 'Spacious and Modern Decor',
      description: 'The spaciousness and modern decor of the apartments were frequently praised.'
    }
  ];

  actionableChanges = [
    {
      title: 'Address Noise Issues',
      description: 'Improve sound insulation or provide earplugs for guests to mitigate noise disturbances.'
    },
    {
      title: 'Ensure Proper Air Conditioning',
      description: 'Regularly check and maintain air conditioning units to ensure they are functioning properly.'
    },
    {
      title: 'Offer Dedicated Parking Options',
      description: 'Consider providing dedicated parking options to enhance guest convenience.'
    },
    {
      title: 'Maintain High Cleanliness Standards',
      description: 'Ensure high cleanliness standards to avoid negative feedback regarding hygiene.'
    },
    {
      title: 'Improve Communication',
      description: 'Enhance communication regarding services, check-in processes, and parking access to improve guest experience.'
    },
    {
      title: 'Adjust Pricing',
      description: 'Consider adjusting pricing to be more competitive and reflect the value offered.'
    }
  ];

  constructor() { }

  ngOnInit(): void {
  }
}

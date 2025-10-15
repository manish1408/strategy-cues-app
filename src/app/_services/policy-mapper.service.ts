import { Injectable } from '@angular/core';
import { 
  BookingPolicy, 
  AirbnbPolicy, 
  VRBOPolicy, 
  CancellationPolicies, 
  GuestConfiguration,
  MappedPolicy,
  PolicyDisplayConfig 
} from '../_models/cancellation-policy.interface';

@Injectable({
  providedIn: 'root'
})
export class PolicyMapperService {
  
  private defaultConfig: PolicyDisplayConfig = {
    showAllPolicies: false,
    maxPoliciesToShow: 3,
    groupByPlatform: true,
    highlightGeneral: true,
    showPrepaymentInfo: true,
    showRoomTypes: false,
    showDateRanges: true
  };

  /**
   * Map raw cancellation policies to display-friendly format
   */
  mapCancellationPolicies(
    policies: CancellationPolicies, 
    config: Partial<PolicyDisplayConfig> = {}
  ): MappedPolicy[] {
    const finalConfig = { ...this.defaultConfig, ...config };
    const mappedPolicies: MappedPolicy[] = [];

    // Map Booking.com policies
    if (policies.Booking && Array.isArray(policies.Booking)) {
      policies.Booking.forEach((policy, index) => {
        const mapped = this.mapBookingPolicy(policy, index);
        if (mapped) {
          mappedPolicies.push(mapped);
        }
      });
    }

    // Map Airbnb policy
    if (policies.Airbnb) {
      const mapped = this.mapAirbnbPolicy(policies.Airbnb);
      if (mapped) {
        mappedPolicies.push(mapped);
      }
    }

    // Map VRBO policy
    if (policies.VRBO) {
      const mapped = this.mapVRBOPolicy(policies.VRBO);
      if (mapped) {
        mappedPolicies.push(mapped);
      }
    }

    // Sort by priority and limit results
    return this.sortAndLimitPolicies(mappedPolicies, finalConfig);
  }

  /**
   * Map Booking.com policy to display format
   */
  private mapBookingPolicy(policy: BookingPolicy, index: number): MappedPolicy | null {
    if (policy.is_hidden) return null;

    const policyType = this.determinePolicyType(policy.policy_group_title);
    const isGeneral = policy.is_general_policy === 1;
    const isSpecial = policy.is_smp_policy === 1 && !isGeneral;

    return {
      id: `booking-${policy.pt_type_id}-${index}`,
      platform: 'booking',
      title: policy.policy_group_title,
      type: policyType,
      description: this.cleanPolicyText(policy.text),
      cancellationWindow: this.extractCancellationWindow(policy.text),
      refundable: policy.is_non_refundable_policy === 0,
      prepaymentInfo: this.cleanPrepaymentText(policy.prepayment?.text),
      isGeneral,
      isSpecial,
      roomTypes: this.extractRoomTypes(policy.rtm?.rooms),
      totalValue: policy.rtm?.ttv || 'N/A',
      dateRange: {
        start: policy.rtm?.start_date_formatted || '',
        end: policy.rtm?.end_date_formatted || ''
      },
      priority: this.calculatePriority(policy, isGeneral, isSpecial)
    };
  }

  /**
   * Map Airbnb policy to display format
   */
  private mapAirbnbPolicy(policy: AirbnbPolicy): MappedPolicy {
    return {
      id: 'airbnb-policy',
      platform: 'airbnb',
      title: policy.type,
      type: this.determinePolicyType(policy.type),
      description: policy.description,
      cancellationWindow: policy.free_cancellation_until,
      refundable: !policy.type.toLowerCase().includes('non-refundable'),
      prepaymentInfo: null,
      isGeneral: true,
      isSpecial: false,
      roomTypes: [],
      totalValue: 'N/A',
      dateRange: {
        start: '',
        end: ''
      },
      priority: 1
    };
  }

  /**
   * Map VRBO policy to display format
   */
  private mapVRBOPolicy(policy: VRBOPolicy): MappedPolicy {
    return {
      id: 'vrbo-policy',
      platform: 'vrbo',
      title: policy.type,
      type: this.determinePolicyType(policy.type),
      description: policy.description,
      cancellationWindow: policy.free_cancellation_until,
      refundable: !policy.type.toLowerCase().includes('non-refundable'),
      prepaymentInfo: null,
      isGeneral: true,
      isSpecial: false,
      roomTypes: [],
      totalValue: 'N/A',
      dateRange: {
        start: '',
        end: ''
      },
      priority: 1
    };
  }

  /**
   * Determine policy type from title/type string
   */
  private determinePolicyType(title: string): MappedPolicy['type'] {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('non-refundable') || lowerTitle.includes('non refundable')) {
      return 'non-refundable';
    }
    if (lowerTitle.includes('flexible')) {
      return 'flexible';
    }
    if (lowerTitle.includes('moderate')) {
      return 'moderate';
    }
    if (lowerTitle.includes('strict')) {
      return 'strict';
    }
    if (lowerTitle.includes('special')) {
      return 'special';
    }
    
    return 'flexible'; // Default
  }

  /**
   * Clean and format policy text
   */
  private cleanPolicyText(textArray: string[]): string {
    if (!textArray || !Array.isArray(textArray)) return '';
    return textArray.join(' ').trim();
  }

  /**
   * Clean prepayment text by removing HTML and formatting
   */
  private cleanPrepaymentText(text: string): string | null {
    if (!text) return null;
    
    // Remove HTML tags and clean up
    return text
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extract cancellation window from policy text
   */
  private extractCancellationWindow(textArray: string[]): string | null {
    if (!textArray || !Array.isArray(textArray)) return null;
    
    const text = textArray.join(' ').toLowerCase();
    
    // Look for time patterns
    const timePatterns = [
      /(\d+)\s*(day|days|hour|hours|pm|am)/g,
      /until\s*(\d+)\s*(day|days|hour|hours)/g,
      /(\d+)\s*(day|days)\s*before/g
    ];
    
    for (const pattern of timePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }
    
    return null;
  }

  /**
   * Extract room types from rooms string
   */
  private extractRoomTypes(rooms: string): string[] {
    if (!rooms || rooms === '0') return [];
    return [`${rooms} room${rooms !== '1' ? 's' : ''}`];
  }

  /**
   * Calculate priority for policy ordering
   */
  private calculatePriority(policy: BookingPolicy, isGeneral: boolean, isSpecial: boolean): number {
    let priority = 10; // Default priority
    
    if (isGeneral) priority = 1; // General policies first
    if (isSpecial) priority = 5; // Special policies second
    if (policy.is_non_refundable_policy === 1) priority += 2; // Non-refundable last
    
    return priority;
  }

  /**
   * Sort policies by priority and limit results
   */
  private sortAndLimitPolicies(policies: MappedPolicy[], config: PolicyDisplayConfig): MappedPolicy[] {
    // Sort by priority (lower number = higher priority)
    const sorted = policies.sort((a, b) => a.priority - b.priority);
    
    // Limit results if not showing all
    if (!config.showAllPolicies && config.maxPoliciesToShow > 0) {
      return sorted.slice(0, config.maxPoliciesToShow);
    }
    
    return sorted;
  }

  /**
   * Format guest configuration for display
   */
  formatGuestConfiguration(guestConfig: GuestConfiguration): string {
    if (!guestConfig) return 'No guest configuration available';

    const configs: string[] = [];

    if (guestConfig.Booking) {
      const booking = guestConfig.Booking;
      configs.push(`Booking.com: ${booking.max_adults} adults, ${booking.max_children} children, ${booking.max_infants} infants`);
    }

    if (guestConfig.Airbnb) {
      const airbnb = guestConfig.Airbnb;
      configs.push(`Airbnb: ${airbnb.max_guests} guests (${airbnb.max_adults} adults, ${airbnb.max_children} children, ${airbnb.max_infants} infants)`);
    }

    if (guestConfig.VRBO) {
      const vrbo = guestConfig.VRBO;
      configs.push(`VRBO: ${vrbo.max_guests} guests (${vrbo.max_adults} adults, ${vrbo.max_children} children)`);
    }

    return configs.length > 0 ? configs.join(' | ') : 'No guest configuration available';
  }

  /**
   * Get policy type CSS class
   */
  getPolicyTypeClass(policyType: MappedPolicy['type']): string {
    const classMap = {
      'flexible': 'badge-success',
      'moderate': 'badge-warning',
      'strict': 'badge-danger',
      'non-refundable': 'badge-dark',
      'special': 'badge-info'
    };
    
    return classMap[policyType] || 'badge-secondary';
  }

  /**
   * Get platform icon class
   */
  getPlatformIconClass(platform: MappedPolicy['platform']): string {
    const iconMap = {
      'booking': 'fas fa-bed',
      'airbnb': 'fab fa-airbnb',
      'vrbo': 'fas fa-home'
    };
    
    return iconMap[platform] || 'fas fa-question';
  }
}

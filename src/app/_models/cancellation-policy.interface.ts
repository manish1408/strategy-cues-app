// Cancellation Policy Interfaces

export interface BookingPolicy {
  policy_group_title: string;
  pt_type_id: number;
  rtm: {
    rooms: string;
    start_date_formatted: string;
    ttv: string;
    end_date_formatted: string;
  };
  controls_settings: {
    is_guaranteed_non_refundable_policy: number;
    show_delete_button: number;
    show_edit_button: number;
  };
  is_hidden: number;
  text: string[];
  prepayment: {
    method_text: string;
    refund: number;
    method: number;
    text: string;
  };
  is_non_refundable_policy: number;
  is_general_policy: number;
  is_smp_policy: number;
}

export interface AirbnbPolicy {
  type: string;
  description: string;
  free_cancellation_until: string | null;
}

export interface VRBOPolicy {
  type: string;
  description: string;
  free_cancellation_until: string | null;
}

export interface CancellationPolicies {
  Booking: BookingPolicy[];
  Airbnb: AirbnbPolicy | null;
  VRBO: VRBOPolicy | null;
}

export interface GuestConfiguration {
  Booking?: {
    max_adults: number;
    max_children: number;
    max_infants: number;
  };
  Airbnb?: {
    max_guests: number;
    max_adults: number;
    max_children: number;
    max_infants: number;
  };
  VRBO?: {
    max_guests: number;
    max_adults: number;
    max_children: number;
  };
}

// Mapped Policy Interfaces for Display
export interface MappedPolicy {
  id: string;
  platform: 'booking' | 'airbnb' | 'vrbo';
  title: string;
  type: 'flexible' | 'moderate' | 'strict' | 'non-refundable' | 'special';
  description: string;
  cancellationWindow: string | null;
  refundable: boolean;
  prepaymentInfo: string | null;
  isGeneral: boolean;
  isSpecial: boolean;
  roomTypes: string[];
  totalValue: string;
  dateRange: {
    start: string;
    end: string;
  };
  priority: number; // For ordering policies
}

export interface PolicyDisplayConfig {
  showAllPolicies: boolean;
  maxPoliciesToShow: number;
  groupByPlatform: boolean;
  highlightGeneral: boolean;
  showPrepaymentInfo: boolean;
  showRoomTypes: boolean;
  showDateRanges: boolean;
}

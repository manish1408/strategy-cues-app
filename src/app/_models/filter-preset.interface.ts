export interface FilterPreset {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  propertyIds?: string[];
  filters: {
    // Basic filters
    selectedArea?: string;
    selectedRoomType?: string;
    
    // Range filters
    adrMin?: number | null;
    adrMax?: number | null;
    revparMin?: number | null;
    revparMax?: number | null;
    mpiMin?: number | null;
    mpiMax?: number | null;
    minRateThresholdMin?: number | null;
    minRateThresholdMax?: number | null;
    
    // Occupancy filters
    occupancyTMMin?: number | null;
    occupancyTMMax?: number | null;
    occupancyNMMin?: number | null;
    occupancyNMMax?: number | null;
    occupancy7DaysMin?: number | null;
    occupancy7DaysMax?: number | null;
    occupancy30DaysMin?: number | null;
    occupancy30DaysMax?: number | null;
    pickUpOcc7DaysMin?: number | null;
    pickUpOcc7DaysMax?: number | null;
    pickUpOcc14DaysMin?: number | null;
    pickUpOcc14DaysMax?: number | null;
    pickUpOcc30DaysMin?: number | null;
    pickUpOcc30DaysMax?: number | null;
    
    // Performance filters
    stlyVarOccMin?: number | null;
    stlyVarOccMax?: number | null;
    stlyVarADRMin?: number | null;
    stlyVarADRMax?: number | null;
    stlyVarRevPARMin?: number | null;
    stlyVarRevPARMax?: number | null;
    stlmVarOccMin?: number | null;
    stlmVarOccMax?: number | null;
    stlmVarADRMin?: number | null;
    stlmVarADRMax?: number | null;
    stlmVarRevPARMin?: number | null;
    stlmVarRevPARMax?: number | null;
    
    // Platform filters
    bookingGeniusFilter?: string;
    bookingMobileFilter?: string;
    bookingPrefFilter?: string;
    bookingWeeklyFilter?: string;
    bookingMonthlyFilter?: string;
    bookingLMDiscFilter?: string;
    airbnbWeeklyFilter?: string;
    airbnbMonthlyFilter?: string;
    airbnbMemberFilter?: string;
    airbnbLMDiscFilter?: string;
    vrboWeeklyFilter?: string;
    vrboMonthlyFilter?: string;
    
    // Reviews filters
    bookingRevScoreMin?: number | null;
    bookingRevScoreMax?: number | null;
    bookingTotalRevMin?: number | null;
    bookingTotalRevMax?: number | null;
    airbnbRevScoreMin?: number | null;
    airbnbRevScoreMax?: number | null;
    airbnbTotalRevMin?: number | null;
    airbnbTotalRevMax?: number | null;
    vrboRevScoreMin?: number | null;
    vrboRevScoreMax?: number | null;
    vrboTotalRevMin?: number | null;
    vrboTotalRevMax?: number | null;
  };
}

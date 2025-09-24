export enum Status {
  PENDING = "pending",
  SCRAPING_IN_PROGRESS = "scraping_in_progress",
  ERROR_IN_SCRAPING = "error_in_scraping",
  MAPPING_IN_PROGRESS = "mapping_in_progress",
  ERROR_IN_MAPPING = "error_in_mapping",
  COMPLETED = "completed"
}

export interface StatusInfo {
  syncStatus: Status;
  mappingStatus: Status;
  lastUpdated?: Date;
}

export interface PropertyStatus {
  propertyId: string;
  operatorId: string;
  syncStatus: string;
  mappingStatus: string;
  lastUpdated?: Date;
}

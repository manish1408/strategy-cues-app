export enum Status {
  PENDING = "pending",
  IN_PROGRESS = "in_progress", 
  COMPLETED = "completed",
  FAILED = "failed"
}

export interface StatusInfo {
  syncStatus: Status;
  mappingStatus: Status;
  lastUpdated?: Date;
}

export interface PropertyStatus {
  propertyId: string;
  operatorId: string;
  syncStatus: Status;
  mappingStatus: Status;
  lastUpdated?: Date;
}

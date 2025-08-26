import { AppEventType } from '../_constants/appEventsType.enum';

export interface AppEvent<T> {
  type: AppEventType | string;
  payload?: T;
}

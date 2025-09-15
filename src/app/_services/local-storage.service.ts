import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  constructor() { }

  public setItem(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  public getItem(key: string): any {
    const value = localStorage.getItem(key);
    // Return null instead of null string for consistency
    return value === null ? null : value;
  }

  public removeItem(key:string): void  {
    localStorage.removeItem(key);
  }

  public clear(): void {
    localStorage.clear();
  }

  getSelectedOperatorId(): string | null {
    const selectedOperator = localStorage.getItem('selectedOperator');
    if (selectedOperator) {
      try {
        const operator = JSON.parse(selectedOperator);
        return operator._id || null;
      } catch (error) {
        console.error('Error parsing selectedOperator:', error);
        return null;
      }
    }
    return null;
  }
}

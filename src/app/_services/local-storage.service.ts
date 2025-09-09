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
}

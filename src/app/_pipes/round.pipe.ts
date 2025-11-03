import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'round'
})
export class RoundPipe implements PipeTransform {

  transform(value: any): any {
    if (value === null || value === undefined || value === 'N/A') {
      return value;
    }
    if (typeof value === "number") {
      return Math.round(value);
    }
    if (typeof value === "string") {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        return value; // Return original if not a valid number
      }
      return Math.round(numValue);
    }
    return value;
  }
}


import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeAgo',
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: any, args?: any): any {
    if (!value) return value;

    const now = new Date();
    const then = new Date(value);
    const seconds = Math.floor((+now - +then) / 1000);

    if (seconds < 29) {
      return 'Just now';
    }

    const intervals: any = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
      second: 1,
    };

    // If more than 1 day, show full date and time
    if (seconds > intervals.day) {
      return this.formatDate(then);
    }

    for (const i in intervals) {
      const counter = Math.floor(seconds / intervals[i]);
      if (counter > 0) {
        return counter + ' ' + i + (counter === 1 ? ' ago' : 's ago');
      }
    }

    return value;
  }

  private formatDate(date: Date): string {
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = pad(date.getMinutes());
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // Convert to 12-hour format

    return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
  }
}

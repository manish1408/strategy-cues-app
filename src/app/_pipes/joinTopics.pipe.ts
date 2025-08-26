import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'topics',
})
export class JoinTopicsPipe implements PipeTransform {
  transform(topics: any[]): string {
    return topics.map((m) => m).join(', ');
  }
}

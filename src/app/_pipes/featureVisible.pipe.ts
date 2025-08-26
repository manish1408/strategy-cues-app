import { Pipe, PipeTransform } from '@angular/core';
import { ChatbotConfigService } from '../_services/chatbot-config.service';

@Pipe({
  name: 'featureVisible',
  pure: false 
})
export class FeatureVisibilityPipe implements PipeTransform {
	constructor(private configService: ChatbotConfigService) {}

  transform(featurePath: string): boolean {
    // 1. Split the path into parts
    const parts = featurePath?.split('.') || [];
    if (parts.length < 2) return true; // Show if invalid path format

    // 2. Get the correct config
    const config = parts[0] === 'navbar' 
      ? this.configService.getNavbarConfig()
      : this.configService.getFeaturesConfig();

    // 3. If config is empty, show the feature
    if (Object.keys(config).length === 0) return true;

    // 4. Traverse the config path with proper type checking
    let current: any = config;
    for (let i = 1; i < parts.length; i++) {
      if (current[parts[i]] === undefined) {
        return true; // Show if any path segment doesn't exist
      }
      current = current[parts[i]];
    }

    // 5. Only hide if the final value is EXPLICITLY boolean false
    return typeof current === 'boolean' ? current : true;
  }
}
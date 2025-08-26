import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml, SafeResourceUrl, SafeScript, SafeStyle, SafeUrl } from '@angular/platform-browser';

@Pipe({ name: 'safe' })
export class SafePipe implements PipeTransform {
	constructor(protected sanitizer: DomSanitizer) {}

	public transform(value: any, type: string): SafeHtml | SafeStyle | SafeScript | SafeUrl | SafeResourceUrl {
		switch (type) {
			case 'html':
				return this.sanitizer.bypassSecurityTrustHtml(value);
			case 'url':
				return this.sanitizer.bypassSecurityTrustUrl(value);
			case 'resourceUrl':
				return this.sanitizer.bypassSecurityTrustResourceUrl(value);
		}

		return value;
	}
}

import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { HttpClient } from '@angular/common/http';


@Injectable({
    providedIn: 'root',
  })
  export class ImageCaptionService {
      private _url = environment.APIUrl + "image-captions";
  constructor(private http: HttpClient) {}

  generateCaption(image_url: string){
    return this.http.post<any>(`${this._url}/get-caption?image_url=${encodeURIComponent(image_url)}`, {});
  }

  getGeneratedCaptions(image_urls: string[]){
    const queryParams = image_urls.map(url => `image_urls=${encodeURIComponent(url)}`).join('&');
    return this.http.get<any>(`${this._url}/bulk-captions?${queryParams}`);
  }


            }
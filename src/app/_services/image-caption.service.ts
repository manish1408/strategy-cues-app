import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

// Type definitions for better type safety
export interface ImageCaptionRequest {
  operator_id: string;
  property_id: string;
  source: 'airbnb' | 'booking' | 'vrbo';
  image_url: string;
  image_id: string;
}

export interface ImageCaptionResponse {
  caption: string;
  success: boolean;
  message?: string;
}

export interface BulkCaptionRequest {
  image_urls: string[];
}

export interface BulkCaptionResponse {
  captions: Array<{
    image_url: string;
    caption: string;
    success: boolean;
  }>;
}

export interface CaptionsBySourceRequest {
  operator_id: string;
  property_id: string;
  source: 'airbnb' | 'booking' | 'vrbo';
}

export interface CaptionsBySourceResponse {
  data: {
    image_captions: Array<{
      id: string;
      url: string;
      caption?: string;
    }>;
  };
  success: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ImageCaptionService {
  private readonly baseUrl = `${environment.APIUrl}image-captions`;

  constructor(private http: HttpClient) {}

  /**
   * Generate caption for a single image
   * @param request - Image caption request parameters
   * @returns Observable of image caption response
   */
  generateCaption(request: ImageCaptionRequest): Observable<ImageCaptionResponse> {
    const params = new HttpParams()
      .set('operator_id', request.operator_id)
      .set('property_id', request.property_id)
      .set('source', request.source)
      .set('image_url', request.image_url)
      .set('image_id', request.image_id);

    return this.http.post<ImageCaptionResponse>(`${this.baseUrl}/get-caption`, {}, { params });
  }

  /**
   * Generate captions for multiple images
   * @param imageUrls - Array of image URLs
   * @returns Observable of bulk caption response
   */
  getGeneratedCaptions(imageUrls: string[]): Observable<BulkCaptionResponse> {
    if (!imageUrls || imageUrls.length === 0) {
      throw new Error('Image URLs array cannot be empty');
    }

    const params = new HttpParams().set('image_urls', imageUrls.join(','));

    return this.http.get<BulkCaptionResponse>(`${this.baseUrl}/bulk-captions`, { params });
  }

  /**
   * Get image captions by source platform
   * @param request - Request parameters for getting captions by source
   * @returns Observable of captions by source response
   */
  getCaptionsBySource(request: CaptionsBySourceRequest): Observable<CaptionsBySourceResponse> {
    const params = new HttpParams()
      .set('operator_id', request.operator_id)
      .set('property_id', request.property_id)
      .set('source', request.source);

    return this.http.get<CaptionsBySourceResponse>(`${this.baseUrl}/captions-by-source`, { params });
  }

  /**
   * Generate caption for a single image URL (legacy method for backward compatibility)
   * @param imageUrl - Single image URL
   * @returns Observable of image caption response
   * @deprecated Use generateCaption with full request object instead
   */
  generateCaptionLegacy(imageUrl: string): Observable<ImageCaptionResponse> {
    const params = new HttpParams().set('image_url', encodeURIComponent(imageUrl));
    
    return this.http.post<ImageCaptionResponse>(`${this.baseUrl}/get-caption`, {}, { params });
  }
}
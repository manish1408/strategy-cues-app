import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FileResponse {
  id: string;
  fileName: string;
  user_id: string;
  url: string;
  createdAt: string;
  userName: string;
}

export interface FilesListResponse {
  files: FileResponse[];
  pagination: {
    total: number;
    page: number;
    total_pages: number;
    limit: number;
    skip: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class FileManagementService {
  private readonly baseUrl = `${environment.APIUrl}files`;

  constructor(private http: HttpClient) {}

  /**
   * Upload a file
   * @param file - File to upload
   * @returns Observable of upload response
   */
  uploadFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.baseUrl}/upload`, formData);
  }

  /**
   * Delete a file
   * @param fileId - ID of the file to delete
   * @returns Observable of delete response
   */
  deleteFile(fileId: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${fileId}`);
  }

  /**
   * Get user files with pagination
   * @param skip - Number of records to skip
   * @param limit - Number of records to return
   * @param sort_by - Field to sort by (default: '_id')
   * @param sort_order - Sort order 'asc' or 'desc' (default: 'desc')
   * @returns Observable of files list response
   */
  getFiles(skip: number = 0, limit: number = 10, sort_by: string = '_id', sort_order: string = 'desc'): Observable<{ data: FilesListResponse; success: boolean }> {
    let params = new HttpParams()
      .set('skip', skip.toString())
      .set('limit', limit.toString())
      .set('sortBy', sort_by)
      .set('sortOrder', sort_order);
    
    return this.http.get<{ data: FilesListResponse; success: boolean }>(`${this.baseUrl}/`, { params });
  }
}


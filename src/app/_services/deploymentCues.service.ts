import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class DeploymentCuesService {
  private _url = environment.APIUrl + "deployment-cues";
  constructor(private http: HttpClient) {}

  createOrUploadToDeploymentCues(data: any) {
    return this.http.post<any>(`${this._url}/create-or-upload-to-deployment-cues`, data);
  }
}
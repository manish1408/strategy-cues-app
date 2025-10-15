import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class DeploymentCuesService {
  private _url = environment.APIUrl + "deployment-cues";
  constructor(private http: HttpClient) {}

  createDeploymentCues(data: any) {
    return this.http.post<any>(`${this._url}/create-deployment`, data);
  }

  getDeploymentCues(operator_id: string, page: number = 1, limit: number = 10, sort_order: string = 'desc') {
    const params = {
      operator_id,
      page: page.toString(),
      limit: limit.toString(),
      sort_order
    };
    return this.http.get<any>(`${this._url}/get-deployment-cues`, { params });
  }

  updateDeploymentCue(deployment_cue_id: string, updateData: any) {
    return this.http.put<any>(`${this._url}/update/${deployment_cue_id}`, updateData);
  }

  deleteDeploymentCue(deployment_cue_id: string) {
    return this.http.delete<any>(`${this._url}/delete/${deployment_cue_id}`);
  }

 
  
}
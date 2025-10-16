import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment.development';


@Injectable({
  providedIn: 'root',
})
export class CuePropertiesService {
  private _url = environment.APIUrl + "cue-properties";
  
  constructor(
    private http: HttpClient,
  ) {}

  getCueProperties(operatorId: string) {
    return this.http.get<any>(`${this._url}/get-cue-properties/${operatorId}`);
  }

  createCueProperty(data: any) {
    return this.http.post<any>(`${this._url}/create-cue-property`, data);
  }

  updateCueProperty(cuePropertyId: string, data: any) {
    return this.http.put<any>(`${this._url}/update-cue-property/${cuePropertyId}`, data);
  }

  
}

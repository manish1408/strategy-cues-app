import { Injectable } from '@angular/core';


import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class OperatorService {
    private _url = environment.APIUrl + "operator";
  constructor(
    private http: HttpClient,

  ) {}

 

  getAllOperator(page: number = 1, limit: number = 99){
    return this.http.get(`${this._url}/list?page=${page}&limit=${limit}`);
  }
  createOperator(data: any) {
    return this.http.post<any>(`${this._url}/create`, data);
  }
  updateOperator(data: any, operator_id:string) {
    return this.http.put<any>(`${this._url}/update/${operator_id}`, data);
  }
  deleteOperator(operator_id:string) {
    return this.http.delete<any>(`${this._url}/delete/${operator_id}`);
  }

  fetchOperatorDetail(operator_id:string){
    return this.http.get<any>(`${this._url}/${operator_id}`);
  }

  getAllOperatorList(page: number = 1, limit: number = 100){
    return this.http.get<any>(`${this._url}/list/all?page=${page}&limit=${limit}`);
  }
  deleteOperatorUser(user_id: string, operator_id:string) {
    return this.http.delete<any>(`${this._url}/${operator_id}/users/${user_id}`);
  }

  getSyncStatus(operator_id: string) {
    return this.http.get<any>(`${this._url}/sync-status/${operator_id}`);
  }
}

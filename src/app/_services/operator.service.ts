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

 

  getAllOperator(){
    return this.http.get(`${this._url}/list`);
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
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.prod';

const API_URL =  environment.apiUrl;


const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
  withCredentials: true  // Inclure les credentials pour les requêtes CORS

};

const httpOptionsFormData = {
  headers: new HttpHeaders(),
  withCredentials: true  // Inclure les credentials pour les requêtes CORS
};
@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private http: HttpClient) {}
  
  
  getDatas(endpoint:any): Observable<any> { return this.http.get( `${API_URL}${endpoint}`)}
  deleteData(endpoint:any): Observable<any> { return this.http.delete( `${API_URL}${endpoint}`, { responseType: 'json' });}
  
  saveAnyData(data:any,url:String): Observable<any> {
    return this.http.post(
      API_URL + url,
      data,
      httpOptionsFormData
    );
  }

  updateAnyData(data:any,url:String): Observable<any> {
    return this.http.put(
      API_URL + url,
      data,
      httpOptionsFormData
    );
  }

  saveFormData(formData:FormData,url:String): Observable<any> {
    return this.http.post(
      API_URL + url,
      formData,
      httpOptionsFormData
    );
  }
  updateFormData(formData:FormData,url:String): Observable<any> {
    return this.http.put(
      API_URL + url,
      formData,
      httpOptionsFormData
    );
  }
 
}

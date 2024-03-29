import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { GetCustDiscountParamsModel } from '../models/GetCustDiscountParamsModel';
import { GetCustDiscountByCustomerParamsModel } from '../models/GetCustDiscountByCustomerParamsModel';
import { CreateCustDiscountRequest } from '../models/CreateCustDiscountRequest';
import { CreateCustDiscountResponse } from '../models/CreateCustDiscountResponse';
import { CustDicountForGet } from '../models/CustDiscount';

@Injectable({
  providedIn: 'root'
})
export class CustomerDiscountService {
  // https://bbxbe.azurewebsites.net/api/v1/CustDiscount/discountforcustomer?CustomerID=1
  private readonly BaseUrl = environment.apiUrl + 'api/' + environment.apiVersion + 'CustDiscount';

  constructor(private http: HttpClient) { }

  Get(params?: GetCustDiscountParamsModel): Observable<CustDicountForGet> {
    // Process params
    var queryParams = '';
    var index = 0;

    if (!!params) {
      Object.keys(params).forEach((key: string) => {
        if (params[key as keyof GetCustDiscountParamsModel] != undefined && params[key as keyof GetCustDiscountParamsModel] != null) {
          if (index == 0) {
            queryParams += key + '=' + params[key as keyof GetCustDiscountParamsModel];
          } else {
            queryParams += '&' + key + '=' + params[key as keyof GetCustDiscountParamsModel];
          }
          index++;
        }
      });
    }

    return this.http.get<CustDicountForGet>(this.BaseUrl + (!!params ? ('?' + queryParams) : ''));
  }

  GetByCustomer(params?: GetCustDiscountByCustomerParamsModel): Observable<CustDicountForGet[]> {
    // Process params
    var queryParams = '';
    var index = 0;

    if (!!params) {
      Object.keys(params).forEach((key: string) => {
        if (params[key as keyof GetCustDiscountByCustomerParamsModel] != undefined && params[key as keyof GetCustDiscountByCustomerParamsModel] != null) {
          if (index == 0) {
            queryParams += key + '=' + params[key as keyof GetCustDiscountByCustomerParamsModel];
          } else {
            queryParams += '&' + key + '=' + params[key as keyof GetCustDiscountByCustomerParamsModel];
          }
          index++;
        }
      });
    }

    return this.http.get<CustDicountForGet[]>(this.BaseUrl + '/discountforcustomer' + (!!params ? ('?' + queryParams) : ''));
  }

  Create(req: CreateCustDiscountRequest): Observable<CreateCustDiscountResponse> {
    return this.http.post<CreateCustDiscountResponse>(this.BaseUrl, req);
  }
}

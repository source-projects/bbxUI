import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { GetInvoicesParamListModel } from '../models/GetInvoicesParamListModel';
import { GetInvoicesResponse } from '../models/GetInvoicesResponse';
import { GetInvoiceParamListModel } from '../models/GetInvoiceParamListModel';
import { Invoice } from '../models/Invoice';
import { CreateOutgoingInvoiceRequest } from '../models/CreateOutgoingInvoiceRequest';
import { CreateOutgoingInvoiceResponse } from '../models/CreateOutgoingInvoiceResponse';
import { UpdateInvoiceResponse } from '../models/UpdateInvoiceResponse';
import { UpdateInvoiceRequest } from '../models/UpdateInvoiceRequest';
import { DeleteInvoiceRequest } from '../models/DeleteInvoiceRequest';
import { DeleteInvoiceResponse } from '../models/DeleteInvoiceResponse';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private readonly BaseUrl = environment.apiUrl + 'api/' + environment.apiVersion + 'Invoice';

  constructor(private http: HttpClient) { }

  GetAll(params?: GetInvoicesParamListModel): Observable<GetInvoicesResponse> {
    // Process params
    var queryParams = '';
    var index = 0;

    if (!!params) {
      Object.keys(params).forEach((key: string) => {
        if (params[key as keyof GetInvoicesParamListModel] != undefined && params[key as keyof GetInvoicesParamListModel] != null) {
          if (index == 0) {
            queryParams += key + '=' + params[key as keyof GetInvoicesParamListModel];
          } else {
            queryParams += '&' + key + '=' + params[key as keyof GetInvoicesParamListModel];
          }
          index++;
        }
      });
    }

    return this.http.get<GetInvoicesResponse>(this.BaseUrl + '/query' + (!!params ? ('?' + queryParams) : ''));
  }

  Get(params?: GetInvoiceParamListModel): Observable<Invoice> {
    // Process params
    var queryParams = '';
    var index = 0;

    if (!!params) {
      Object.keys(params).forEach((key: string) => {
        if (params[key as keyof GetInvoiceParamListModel] != undefined && params[key as keyof GetInvoiceParamListModel] != null) {
          if (index == 0) {
            queryParams += key + '=' + params[key as keyof GetInvoiceParamListModel];
          } else {
            queryParams += '&' + key + '=' + params[key as keyof GetInvoiceParamListModel];
          }
          index++;
        }
      });
    }

    // Get
    return this.http.get<Invoice>(this.BaseUrl + (!!params ? ('?' + queryParams) : ''));
  }

  CreateOutgoing(req: CreateOutgoingInvoiceRequest): Observable<CreateOutgoingInvoiceResponse> {
    return this.http.post<CreateOutgoingInvoiceResponse>(this.BaseUrl, req);
  }

  Update(req: UpdateInvoiceRequest): Observable<UpdateInvoiceResponse> {
    return this.http.put<UpdateInvoiceResponse>(this.BaseUrl, req);
  }

  Delete(req: DeleteInvoiceRequest): Observable<DeleteInvoiceResponse> {
    return this.http.delete<DeleteInvoiceResponse>(this.BaseUrl + '?ID=' + req.id);
  }
}

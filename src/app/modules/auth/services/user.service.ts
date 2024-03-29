import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CreateUserRequest } from '../models/CreateUserRequest';
import { DeleteUserRequest } from '../models/DeleteUserRequest';
import { GetUsersResponse as GetUsersResponse } from '../models/GetUsersResponse';
import { UpdateUserRequest } from '../models/UpdateUserRequest';
import { User } from '../models/User';
import { GetUsersParamListModel } from '../models/GetUsersParamListModel';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { GetUserParamListModel } from '../models/GetUserParamListModel';
import { CreateUserResponse } from '../models/CreateUserResponse';
import { UpdateUserResponse } from '../models/UpdateUserResponse';
import { DeleteUserResponse } from '../models/DeleteUserResponse';

const MOCK_USERS = {
  "pageNumber": 1,
  "pageSize": 10,
  "recordsFiltered": 2,
  "recordsTotal": 2,
  "succeeded": true,
  "data": [
    new User(2, "string", "string", "a@mmm", "string", true),
    new User(3, "AAstring", "string", "a@mmm", "string", true),
    new User(4, "inactive", "string", "a@mmm", "string", false),
  ]
} as GetUsersResponse;

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly BaseUrl = environment.apiUrl + 'api/' + environment.apiVersion + 'User';

  constructor(private http: HttpClient) { }

  // GetUsers(): Observable<GetUserResponse> {
  //   return of(MOCK_USERS);
  // }

  GetAll(params?: GetUsersParamListModel): Observable<GetUsersResponse> {
    // Process params
    var queryParams = '';
    var index = 0;

    if (!!params) {
      Object.keys(params).forEach((key: string) => {
        if (params[key as keyof GetUsersParamListModel] != undefined && params[key as keyof GetUsersParamListModel] != null) {
          if (index == 0) {
            queryParams += key + '=' + params[key as keyof GetUsersParamListModel];
          } else {
            queryParams += '&' + key + '=' + params[key as keyof GetUsersParamListModel];
          }
          index++;
        }
      });
    }

    // console.log(this.BaseUrl + '/query' + (!!params ? ('?' + queryParams) : '')); // TODO: only for debug

    // Get
    return this.http.get<GetUsersResponse>(this.BaseUrl + '/query' + (!!params ? ('?' + queryParams) : ''));
  }

  Get(params?: GetUserParamListModel): Observable<User> {
    // Process params
    var queryParams = '';
    var index = 0;

    if (!!params) {
      Object.keys(params).forEach((key: string) => {
        if (params[key as keyof GetUserParamListModel] != undefined && params[key as keyof GetUserParamListModel] != null) {
          if (index == 0) {
            queryParams += key + '=' + params[key as keyof GetUserParamListModel];
          } else {
            queryParams += '&' + key + '=' + params[key as keyof GetUserParamListModel];
          }
          index++;
        }
      });
    }

    // Get
    return this.http.get<User>(this.BaseUrl + (!!params ? ('?' + queryParams) : ''));
  }

  Create(req: CreateUserRequest): Observable<CreateUserResponse> {
    return this.http.post<CreateUserResponse>(this.BaseUrl, req);
  }

  Update(req: UpdateUserRequest): Observable<UpdateUserResponse> {
    return this.http.put<UpdateUserResponse>(this.BaseUrl, req);
  }

  Delete(req: DeleteUserRequest): Observable<DeleteUserResponse> {
    return this.http.delete<DeleteUserResponse>(this.BaseUrl, { body: req });
  }
}

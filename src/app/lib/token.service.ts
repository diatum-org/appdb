import { Injectable, Type, Component } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse, HttpEvent } from '@angular/common/http';
import { HttpUrlEncodingCodec } from '@angular/common/http';

import * as  base64 from "base-64";
import * as utf8 from "utf8";

import { ServiceAccess } from './serviceAccess';

@Injectable()
export class TokenService {

  private headers: HttpHeaders;

  constructor(private httpClient: HttpClient) {
    this.headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Accept': 'application/json' });
  }

  public getAccess(url: string, token: string): Promise<ServiceAccess> {
    return this.httpClient.get<ServiceAccess>(url + "/token/access?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

}

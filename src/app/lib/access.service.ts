import { Injectable, Type, Component } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse, HttpEvent } from '@angular/common/http';
import { HttpUrlEncodingCodec } from '@angular/common/http';

import { ServiceAccess } from './serviceAccess';
import { EmigoToken } from './emigoToken';
import { LinkMessage } from './linkMessage';
import { UserEntry } from './userEntry';

import * as  base64 from "base-64";
import * as utf8 from "utf8";

@Injectable()
export class AccessService {

  private headers: HttpHeaders;

  constructor(private httpClient: HttpClient) {
    this.headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Accept': 'application/json' });
  }

  public createAccount(url: string, token: string): Promise<EmigoToken> {
    return this.httpClient.post<EmigoToken>(url + "/access/emigos?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public getAccess(url: string, token: string): Promise<ServiceAccess> {
    return this.httpClient.get<ServiceAccess>(url + "/access/accounts/authorized?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public authorizeAccount(url: string, token: string, access: ServiceAccess): Promise<LinkMessage> {
    return this.httpClient.post<LinkMessage>(url + "/access/services/created?token=" + token,
        access, { headers: this.headers, observe: 'body' }).toPromise();
  }

  public createUser(url: string, token: string, msg: LinkMessage): Promise<EmigoToken> {
    return this.httpClient.post<EmigoToken>(url + "/access/accounts/created?token=" + token,
        msg, { headers: this.headers, observe: 'body' }).toPromise();
  }

  public assignUser(url: string, token: string, emigo: EmigoToken): Promise<UserEntry> {
    return this.httpClient.post<UserEntry>(url + "/access/services/tokens?token=" + token,
        emigo, { headers: this.headers, observe: 'body' }).toPromise();
  }
  
}

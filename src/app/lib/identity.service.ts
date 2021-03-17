import { Injectable, Type, Component } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse, HttpEvent } from '@angular/common/http';
import { HttpUrlEncodingCodec } from '@angular/common/http';

import * as  base64 from "base-64";
import * as utf8 from "utf8";

import { AmigoMessage } from './amigoMessage';
import { Amigo } from './amigo';

@Injectable()
export class IdentityService {

  private headers: HttpHeaders;

  constructor(private httpClient: HttpClient) {
    this.headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Accept': 'application/json' });
  }

  public getRevision(url: string, token: string): Promise<number> {
    return this.httpClient.get<number>(url + "/identity/revision?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public getAmigo(url: string, token: string): Promise<Amigo> {
    return this.httpClient.get<Amigo>(url + "/identity?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public getMessage(url: string, token: string): Promise<AmigoMessage> {
    return this.httpClient.get<AmigoMessage>(url + "/identity/message?token=" + token,
          { headers: this.headers, observe: 'body' }).toPromise();
  }

  public setRegistry(url: string, token: string, data: string): Promise<AmigoMessage> {
    return this.httpClient.put<AmigoMessage>(url + "/identity/registry?token=" + token,
        data, { headers: this.headers, observe: 'body' }).toPromise();
  }

  public setImage(url: string, token: string, data: string): Promise<AmigoMessage> {
    return this.httpClient.put<AmigoMessage>(url + "/identity/image?token=" + token, 
        data, { headers: this.headers, observe: 'body' }).toPromise();
  }

  public getImageUrl(url: string, token: string, revision: number): string {
    return url + "/identity/image?token=" + token + "&revision=" + revision;
  }

  public setName(url: string, token: string, data: string): Promise<AmigoMessage> {
    return this.httpClient.put<AmigoMessage>(url + "/identity/name?token=" + token, 
        data, { headers: this.headers, observe: 'body' }).toPromise();
  }

  public setHandle(url: string, token: string, data: string): Promise<AmigoMessage> {
    return this.httpClient.put<AmigoMessage>(url + "/identity/handle?token=" + token, 
        data, { headers: this.headers, observe: 'body' }).toPromise();
  }

  public setLocation(url: string, token: string, data: string): Promise<AmigoMessage> {
    return this.httpClient.put<AmigoMessage>(url + "/identity/location?token=" + token, 
        data, { headers: this.headers, observe: 'body' }).toPromise();
  }

  public setDescription(url: string, token: string, data: string): Promise<AmigoMessage> {
    return this.httpClient.put<AmigoMessage>(url + "/identity/description?token=" + token, 
        data, { headers: this.headers, observe: 'body' }).toPromise();
  }

  public getDirty(url: string, token: string): Promise<boolean> {
    return this.httpClient.get<boolean>(url + "/identity/dirty?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public clearDirty(url: string, token: string, revision: number): Promise<void> {
    return this.httpClient.put<void>(url + "/identity/dirty?token=" + token + "&flag=false&revision=" + revision,
        { headers: this.headers, observe: 'body' }).toPromise();
  }
}

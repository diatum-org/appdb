import { Injectable, Type, Component } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse, HttpEvent } from '@angular/common/http';
import { HttpUrlEncodingCodec } from '@angular/common/http';

import { EmigoMessage } from './emigoMessage';
import { Result } from './result';

@Injectable()
export class RegistryService {

  private headers: HttpHeaders;

  constructor(private httpClient: HttpClient) {
    this.headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Accept': 'application/json' });
  }

  public getRevision(url: string, emigoId: string): Promise<number> {
    return this.httpClient.get<number>(url + "/emigo/messages/revision?emigoId=" + emigoId,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public setMessage(url: string, msg: EmigoMessage): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // deliver emigo message
      this.httpClient.post<void>(url + "/emigo/messages",
          msg, { headers: this.headers, observe: 'body' }).toPromise().then(() => {
        resolve();
      }).catch(err => {
        console.log("RegistryService.setMessage failed");
        reject();
      });
    });
  }

  public getEmigoId(url: string, handle: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.httpClient.get(url + "/emigo/id?handle=" + handle, { headers: this.headers, observe: 'body', responseType: 'text' }).toPromise().then(r => {
        resolve(r);
      }).catch(err => {
        console.log("RegistryService.getEmigoId failed");
        reject();
      });
    });
  }

  public checkHandle(url: string, handle: string, emigoId: string = null): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {

      if(emigoId != null) {
        this.httpClient.get<Result>(url + "/emigo/status?handle=" + encodeURI(handle) + "&emigoId=" + emigoId,
            { headers: this.headers, observe: 'body', responseType: 'json' }).toPromise().then(r => {
          resolve(r.boolValue);
        }).catch(err => {
          console.log("RegistryService.checkHandle failed");
          reject();
        });
      }
      else {
        this.httpClient.get<Result>(url + "/emigo/status?handle=" + encodeURI(handle),
            { headers: this.headers, observe: 'body', responseType: 'json' }).toPromise().then(r => {
          resolve(r.boolValue);
        }).catch(err => {
          console.log("RegistryService.checkHandle failed");
          reject();
        });
      }
    });
  }

  public getLogoUrl(url: string, emigoId: string, revision: number): string {
    return url + "/emigo/messages/logo?emigoId=" + emigoId + "&revision=" + revision;
  }

  public getMessage(url: string, emigoId: string): Promise<EmigoMessage> {
    return this.httpClient.get<EmigoMessage>(url + "/emigo/messages/?emigoId=" + emigoId,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public getIdentity(url: string, handle: string): Promise<EmigoMessage> {
    return this.httpClient.get<EmigoMessage>(url + "/emigo/messages/?handle=" + handle,
        { headers: this.headers, observe: 'body' }).toPromise();
  }
}


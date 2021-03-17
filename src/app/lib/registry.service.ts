import { Injectable, Type, Component } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse, HttpEvent } from '@angular/common/http';
import { HttpUrlEncodingCodec } from '@angular/common/http';

import { AmigoMessage } from './amigoMessage';
import { Result } from './result';

@Injectable()
export class RegistryService {

  private headers: HttpHeaders;

  constructor(private httpClient: HttpClient) {
    this.headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Accept': 'application/json' });
  }

  public getRevision(url: string, amigoId: string): Promise<number> {
    return this.httpClient.get<number>(url + "/amigo/messages/revision?amigoId=" + amigoId,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public setMessage(url: string, msg: AmigoMessage): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // deliver amigo message
      this.httpClient.post<void>(url + "/amigo/messages",
          msg, { headers: this.headers, observe: 'body' }).toPromise().then(() => {
        resolve();
      }).catch(err => {
        console.log("RegistryService.setMessage failed");
        reject();
      });
    });
  }

  public getAmigoId(url: string, handle: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.httpClient.get(url + "/amigo/id?handle=" + handle, { headers: this.headers, observe: 'body', responseType: 'text' }).toPromise().then(r => {
        resolve(r);
      }).catch(err => {
        console.log("RegistryService.getAmigoId failed");
        reject();
      });
    });
  }

  public checkHandle(url: string, handle: string, amigoId: string = null): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {

      if(amigoId != null) {
        this.httpClient.get<Result>(url + "/amigo/status?handle=" + encodeURI(handle) + "&amigoId=" + amigoId,
            { headers: this.headers, observe: 'body', responseType: 'json' }).toPromise().then(r => {
          resolve(r.boolValue);
        }).catch(err => {
          console.log("RegistryService.checkHandle failed");
          reject();
        });
      }
      else {
        this.httpClient.get<Result>(url + "/amigo/status?handle=" + encodeURI(handle),
            { headers: this.headers, observe: 'body', responseType: 'json' }).toPromise().then(r => {
          resolve(r.boolValue);
        }).catch(err => {
          console.log("RegistryService.checkHandle failed");
          reject();
        });
      }
    });
  }

  public getLogoUrl(url: string, amigoId: string, revision: number): string {
    return url + "/amigo/messages/logo?amigoId=" + amigoId + "&revision=" + revision;
  }

  public getMessage(url: string, amigoId: string): Promise<AmigoMessage> {
    return this.httpClient.get<AmigoMessage>(url + "/amigo/messages/?amigoId=" + amigoId,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public getIdentity(url: string, handle: string): Promise<AmigoMessage> {
    return this.httpClient.get<AmigoMessage>(url + "/amigo/messages/?handle=" + handle,
        { headers: this.headers, observe: 'body' }).toPromise();
  }
}


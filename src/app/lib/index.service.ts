import { Injectable, Type, Component } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse, HttpEvent } from '@angular/common/http';
import { HttpUrlEncodingCodec } from '@angular/common/http';

import { Amigo } from './amigo';
import { AmigoEntry } from './amigoEntry';
import { AmigoView } from './amigoView';
import { AmigoMessage } from './amigoMessage';
import { PendingAmigo } from './pendingAmigo';
import { PendingAmigoView } from './pendingAmigoView';
import { ShareMessage } from './shareMessage';

@Injectable()
export class IndexService {

  private headers: HttpHeaders;

  constructor(private httpClient: HttpClient) {
    this.headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Accept': 'application/json' });
  }

  public getRevision(url: string, token: string): Promise<number> {
    return this.httpClient.get<number>(url + "/index/revision?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public getAmigoRevision(url: string, token: string, amigoId: string): Promise<number> {
    return this.httpClient.get<number>(url + "/index/amigos/" + amigoId + "/revision?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public getAmigoIdentity(url: string, token: string, amigoId: string): Promise<Amigo> {
    return this.httpClient.get<Amigo>(url + "/index/amigos/" + amigoId + "/identity?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public getAmigo(url: string, token: string, amigoId: string): Promise<AmigoEntry> {
    return this.httpClient.get<AmigoEntry>(url + "/index/amigos/" + amigoId + "?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public getAmigos(url: string, token: string): Promise<AmigoEntry[]> {
    return this.httpClient.get<AmigoEntry[]>(url + "/index/amigos?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public getAmigoViews(url: string, token: string): Promise<AmigoView[]> {
    return this.httpClient.get<AmigoView[]>(url + "/index/amigos/view?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public setAmigo(url: string, token: string, e: AmigoMessage): Promise<Amigo> {
    return this.httpClient.put<Amigo>(url + "/index/amigos?token=" + token,
        e, { headers: this.headers, observe: 'body' }).toPromise();
  }

  public getPendingRequests(url: string, token: string): Promise<PendingAmigoView[]> {
    return this.httpClient.get<PendingAmigoView[]>(url + "/index/requests?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public getPendingRequest(url: string, token: string, shareId: string): Promise<PendingAmigo> {
    return this.httpClient.get<PendingAmigo>(url + "/index/requests/" + shareId + "?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public addAmigo(url: string, token: string, e: AmigoMessage): Promise<AmigoEntry> {
    return this.httpClient.post<AmigoEntry>(url + "/index/amigos?token=" + token,
        e, { headers: this.headers, observe: 'body' }).toPromise();
  }

  public removeAmigo(url: string, token: string, amigoId: string): Promise<void> {
    return this.httpClient.delete<void>(url + "/index/amigos/" + amigoId + "?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public getAmigoLogoUrl(url: string, token: string, amigoId: string, revision: number): string {
    return url + "/index/amigos/" + amigoId + "/logo?token=" + token + "&revision=" + revision;
  }

  public setAmigoNotes(url: string, token: string, amigoId: string, notes: string): Promise<AmigoEntry> {
    if(notes == null) {
      return this.httpClient.delete<AmigoEntry>(url + "/index/amigos/" + amigoId + "/notes?token=" + token, 
          { headers: this.headers, observe: 'body' }).toPromise();
    }
    else {
      return this.httpClient.put<AmigoEntry>(url + "/index/amigos/" + amigoId + "/notes?token=" + token, 
          notes, { headers: this.headers, observe: 'body' }).toPromise();
    }
  }

  public setAmigoLabels(url: string, token: string, amigoId: string, labelIds: string[]): Promise<AmigoEntry> {
    return this.httpClient.put<AmigoEntry>(url + "/index/amigos/" + amigoId + "/labels" + "?token=" + token, 
        labelIds, { headers: this.headers, observe: 'body' }).toPromise();
  }

  public setAmigoLabel(url: string, token: string, amigoId: string, labelId: string): Promise<AmigoEntry> {
    return this.httpClient.post<AmigoEntry>(url + "/index/amigos/" + amigoId + "/labels/" + labelId + "?token=" + token, 
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public clearAmigoLabel(url: string, token: string, amigoId: string, labelId: string): Promise<AmigoEntry> {
    return this.httpClient.delete<AmigoEntry>(url + "/index/amigos/" + amigoId + "/labels/" + labelId + "?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public clearRequest(url: string, token: string, shareId: string): Promise<ShareMessage> {
    return this.httpClient.delete<ShareMessage>(url + "/index/requests/" + shareId + "?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }
}


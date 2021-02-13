import { Injectable, Type, Component } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse, HttpEvent } from '@angular/common/http';
import { HttpUrlEncodingCodec } from '@angular/common/http';

import { Emigo } from './emigo';
import { EmigoEntry } from './emigoEntry';
import { EmigoView } from './emigoView';
import { EmigoMessage } from './emigoMessage';
import { PendingEmigo } from './pendingEmigo';
import { PendingEmigoView } from './pendingEmigoView';
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

  public getEmigoRevision(url: string, token: string, emigoId: string): Promise<number> {
    return this.httpClient.get<number>(url + "/index/emigos/" + emigoId + "/revision?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public getEmigoIdentity(url: string, token: string, emigoId: string): Promise<Emigo> {
    return this.httpClient.get<Emigo>(url + "/index/emigos/" + emigoId + "/identity?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public getEmigo(url: string, token: string, emigoId: string): Promise<EmigoEntry> {
    return this.httpClient.get<EmigoEntry>(url + "/index/emigos/" + emigoId + "?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public getEmigos(url: string, token: string): Promise<EmigoEntry[]> {
    return this.httpClient.get<EmigoEntry[]>(url + "/index/emigos?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public getEmigoViews(url: string, token: string): Promise<EmigoView[]> {
    return this.httpClient.get<EmigoView[]>(url + "/index/emigos/view?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public setEmigo(url: string, token: string, e: EmigoMessage): Promise<Emigo> {
    return this.httpClient.put<Emigo>(url + "/index/emigos?token=" + token,
        e, { headers: this.headers, observe: 'body' }).toPromise();
  }

  public getPendingRequests(url: string, token: string): Promise<PendingEmigoView[]> {
    return this.httpClient.get<PendingEmigoView[]>(url + "/index/requests?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public getPendingRequest(url: string, token: string, shareId: string): Promise<PendingEmigo> {
    return this.httpClient.get<PendingEmigo>(url + "/index/requests/" + shareId + "?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public addEmigo(url: string, token: string, e: EmigoMessage): Promise<EmigoEntry> {
    return this.httpClient.post<EmigoEntry>(url + "/index/emigos?token=" + token,
        e, { headers: this.headers, observe: 'body' }).toPromise();
  }

  public removeEmigo(url: string, token: string, emigoId: string): Promise<void> {
    return this.httpClient.delete<void>(url + "/index/emigos/" + emigoId + "?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public getEmigoLogoUrl(url: string, token: string, emigoId: string, revision: number): string {
    return url + "/index/emigos/" + emigoId + "/logo?token=" + token + "&revision=" + revision;
  }

  public setEmigoNotes(url: string, token: string, emigoId: string, notes: string): Promise<EmigoEntry> {
    if(notes == null) {
      return this.httpClient.delete<EmigoEntry>(url + "/index/emigos/" + emigoId + "/notes?token=" + token, 
          { headers: this.headers, observe: 'body' }).toPromise();
    }
    else {
      return this.httpClient.put<EmigoEntry>(url + "/index/emigos/" + emigoId + "/notes?token=" + token, 
          notes, { headers: this.headers, observe: 'body' }).toPromise();
    }
  }

  public setEmigoLabels(url: string, token: string, emigoId: string, labelIds: string[]): Promise<EmigoEntry> {
    return this.httpClient.put<EmigoEntry>(url + "/index/emigos/" + emigoId + "/labels" + "?token=" + token, 
        labelIds, { headers: this.headers, observe: 'body' }).toPromise();
  }

  public setEmigoLabel(url: string, token: string, emigoId: string, labelId: string): Promise<EmigoEntry> {
    return this.httpClient.post<EmigoEntry>(url + "/index/emigos/" + emigoId + "/labels/" + labelId + "?token=" + token, 
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public clearEmigoLabel(url: string, token: string, emigoId: string, labelId: string): Promise<EmigoEntry> {
    return this.httpClient.delete<EmigoEntry>(url + "/index/emigos/" + emigoId + "/labels/" + labelId + "?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public clearRequest(url: string, token: string, shareId: string): Promise<ShareMessage> {
    return this.httpClient.delete<ShareMessage>(url + "/index/requests/" + shareId + "?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }
}


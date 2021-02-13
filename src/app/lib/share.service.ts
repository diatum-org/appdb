import { Injectable, Type, Component } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse, HttpEvent } from '@angular/common/http';
import { HttpUrlEncodingCodec } from '@angular/common/http';

import { ShareMessage } from './shareMessage';
import { ShareStatus } from './shareStatus';
import { ShareEntry } from './shareEntry';
import { ShareView } from './shareView';

@Injectable()
export class ShareService {

  private headers: HttpHeaders;

  constructor(private httpClient: HttpClient) {
    this.headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Accept': 'application/json' });
  }

  public getConnectionViews(url: string, token: string): Promise<ShareView[]> {
    return this.httpClient.get<ShareView[]>(url + "/share/connections/view?token=" + token, 
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public getConnections(url: string, token: string): Promise<ShareEntry[]> {
    return this.httpClient.get<ShareEntry[]>(url + "/share/connections?token=" + token, 
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public getContact(url: string, token: string, emigoId: string): Promise<ShareEntry[]> {
    return this.httpClient.get<ShareEntry[]>(url + "/share/emigos/" + emigoId + "/connections?token=" + token + "&contacts=true&offset=0&limit=1",
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public getRevision(url: string, token: string): Promise<number> {
    return this.httpClient.get<number>(url + "/share/revision?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public getRequested(url: string, token: string): Promise<ShareEntry[]> {
    return this.httpClient.get<ShareEntry[]>(url + "/share/connections?token=" + token + 
        "&contacts=true&status=requested", { headers: this.headers, observe: 'body' }).toPromise();
  }

  public getReceived(url: string, token: string): Promise<ShareEntry[]> {
    return this.httpClient.get<ShareEntry[]>(url + "/share/connections?token=" + token + 
        "&contacts=true&status=received", { headers: this.headers, observe: 'body' }).toPromise();
  }

  public getEntry(url: string, token: string, shareId: string): Promise<ShareEntry> {
    return this.httpClient.get<ShareEntry>(url + "/share/connections/" + shareId + "?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
    }

  public addConnection(url: string, token: string, emigoId: string): Promise<ShareEntry> {
    return this.httpClient.post<ShareEntry>(url + "/share/connections?token=" + token + "&emigoId=" + emigoId, 
        { headers: this.headers, observe: 'body' }).toPromise();
  } 

  public getConnection(url: string, token: string, shareId: string): Promise<ShareEntry> {
    return this.httpClient.get<ShareEntry>(url + "/share/connections/" + shareId + "?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public removeConnection(url: string, token: string, shareId: string): Promise<void> {
    return this.httpClient.delete<void>(url + "/share/connections/" + shareId + "?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public getMessage(url: string, token: string, shareId: string): Promise<ShareMessage> {
    return this.httpClient.get<ShareMessage>(url + "/share/" + shareId + "/message?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public setMessage(url: string, emigoId: string, msg: ShareMessage): Promise<ShareStatus> {
    return this.httpClient.post<ShareStatus>(url + "/share/messages?emigoId=" + emigoId, msg,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public updateStatus(url: string, token: string, shareId: string, status: string, shareToken: string): Promise<ShareEntry> {
    let t: string = "";
    if(shareToken != null) {
      t = "&shareToken=" + shareToken;
    }
    let s: string = "";
    if(status != null) {
      s = "&status=" + status;
    }
    return this.httpClient.put<ShareEntry>(url + "/share/connections/" + shareId + "/status?token=" + token + s + t, 
        { headers: this.headers, observe: 'body' }).toPromise();
  }
}


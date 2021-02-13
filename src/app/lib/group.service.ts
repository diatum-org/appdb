import { Injectable, Type, Component } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse, HttpEvent } from '@angular/common/http';
import { HttpUrlEncodingCodec } from '@angular/common/http';

import { LabelEntry } from './labelEntry';
import { LabelView } from './labelView';

@Injectable()
export class GroupService {

  private headers: HttpHeaders;

  constructor(private httpClient: HttpClient) {
    this.headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Accept': 'application/json' });
  }

  public getRevision(url: string, token: string): Promise<number> {
    return this.httpClient.get<number>(url + "/group/revision?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public getLabelViews(url: string, token: string): Promise<LabelView[]> {
    return this.httpClient.get<LabelView[]>(url + "/group/labels/view?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public getLabels(url: string, token: string): Promise<LabelEntry[]> {
    return this.httpClient.get<LabelEntry[]>(url + "/group/labels?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public addLabel(url: string, token: string, l: string): Promise<LabelEntry> {
    let name: string = encodeURIComponent(l);
    return this.httpClient.post<LabelEntry>(url + "/group/labels/?token=" + token + "&name=" + name,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public getLabel(url: string, token: string, id: string): Promise<LabelEntry> {
    return this.httpClient.get<LabelEntry>(url + "/group/labels/" + id + "?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public updateLabel(url: string, token: string, id: string, l: string): Promise<LabelEntry> {
    let name: string = encodeURIComponent(l);
    return this.httpClient.put<LabelEntry>(url + "/group/labels/" + id + "/name?token=" + token + "&name=" + name,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public removeLabel(url: string, token: string, id: string): Promise<void> {
    return this.httpClient.delete<void>(url + "/group/labels/" + id + "?token=" + token,
        { headers: this.headers }).toPromise();
  }
}


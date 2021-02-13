import { Injectable, Type, Component } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse, HttpEvent } from '@angular/common/http';
import { HttpUrlEncodingCodec } from '@angular/common/http';

import { Attribute } from './attribute';
import { AttributeEntry } from './attributeEntry';
import { LabelEntry } from './labelEntry';
import { AttributeView } from './attributeView';

@Injectable()
export class ProfileService {

  private headers: HttpHeaders;

  constructor(private httpClient: HttpClient) {
    this.headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Accept': 'application/json' });
  }

  public getRevision(url: string, token: string): Promise<number> {
    return this.httpClient.get<number>(url + "/profile/revision?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public getAttribute(url: string, token: string, attributeId: string): Promise<AttributeEntry> {
    return this.httpClient.get<AttributeEntry>(url + "/profile/attributes/" + attributeId + "?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public getAttributes(url: string, token: string, filter: string[]): Promise<AttributeEntry[]> {
    return this.httpClient.post<AttributeEntry[]>(url + "/profile/attributes/filter?token=" + token,
        filter, { headers: this.headers, observe: 'body' }).toPromise();
  }

  public getAttributeViews(url: string, token: string, filter: string[]): Promise<AttributeView[]> {
    return this.httpClient.post<AttributeView[]>(url + "/profile/attributes/view?token=" + token,
        filter, { headers: this.headers, observe: 'body' }).toPromise();
  }

  public addAttribute(url: string, token: string, schema: string, data: string): Promise<AttributeEntry> {
    return this.httpClient.post<AttributeEntry>(url + "/profile/attributes?token=" + token + "&schema=" + schema,
        data, { headers: this.headers, observe: 'body' }).toPromise();
  }

  public updateAttribute(url: string, token: string, attributeId: string, schema: string, data: string): Promise<AttributeEntry> {
    return this.httpClient.put<AttributeEntry>(url + "/profile/attributes/" + attributeId + "?token=" + token + "&schema=" + schema,
        data, { headers: this.headers, observe: 'body' }).toPromise();
  }

  public removeAttribute(url: string, token: string, attributeId: string): Promise<void> {
    return this.httpClient.delete<void>(url + "/profile/attributes/" + attributeId + "?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public setAttributeLabels(url: string, token: string, attributeId: string, labelIds: string[]): Promise<AttributeEntry> {
    return this.httpClient.put<AttributeEntry>(url + "/profile/attributes/" + attributeId + "/labels" + "?token=" + token,
        labelIds, { headers: this.headers, observe: 'body' }).toPromise();
  }

  public setAttributeLabel(url: string, token: string, attributeId: string, labelId: string): Promise<AttributeEntry> {
    return this.httpClient.post<AttributeEntry>(url + "/profile/attributes/" + attributeId + "/labels/" + labelId + "?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public clearAttributeLabel(url: string, token: string, attributeId: string, labelId: string): Promise<AttributeEntry> {
    return this.httpClient.delete<AttributeEntry>(url + "/profile/attributes/" + attributeId + "/labels/" + labelId + "?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

}


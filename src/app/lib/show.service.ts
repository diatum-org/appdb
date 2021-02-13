import { Injectable, Type, Component } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse, HttpEvent } from '@angular/common/http';
import { HttpUrlEncodingCodec } from '@angular/common/http';

import { Subject } from './subject';
import { SubjectTag } from './subjectTag';
import { SubjectEntry } from './subjectEntry';
import { LabelEntry } from './labelEntry';
import { SubjectView } from './subjectView';

@Injectable()
export class ShowService {

  private headers: HttpHeaders;

  constructor(private httpClient: HttpClient) {
    this.headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Accept': 'application/json' });
  }

  public getRevision(url: string, token: string): Promise<number> {
    return this.httpClient.get<number>(url + "/show/revision?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public getSubject(url: string, token: string, subjectId: string): Promise<SubjectEntry> {
    return this.httpClient.get<SubjectEntry>(url + "/show/subjects/" + subjectId + "?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public getSubjects(url: string, token: string, filter: string[]): Promise<SubjectEntry[]> {
    return this.httpClient.post<SubjectEntry[]>(url + "/show/subjects/filter?token=" + token,
        filter, { headers: this.headers, observe: 'body' }).toPromise();
  }

  public getSubjectViews(url: string, token: string, filter: string[]): Promise<SubjectView[]> {
    return this.httpClient.post<SubjectView[]>(url + "/show/subjects/view?token=" + token,
        filter, { headers: this.headers, observe: 'body' }).toPromise();
  }

  public addSubject(url: string, token: string, schema: string): Promise<SubjectEntry> {
    return this.httpClient.post<SubjectEntry>(url + "/show/subjects?token=" + token + "&schema=" + schema,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public updateSubjectData(url: string, token: string, subjectId: string, schema: string, data: string): Promise<SubjectEntry> {
    return this.httpClient.put<SubjectEntry>(url + "/show/subjects/" + subjectId + "/data?token=" + token + "&schema=" + schema,
        data, { headers: this.headers, observe: 'body' }).toPromise();
  }

  public updateSubjectShare(url: string, token: string, subjectId: string, share: boolean): Promise<SubjectEntry> {
    return this.httpClient.put<SubjectEntry>(url + "/show/subjects/" + subjectId + "/access?token=" + token + "&done=" + share,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public updateSubjectExpire(url: string, token: string, subjectId: string, expire: number): Promise<SubjectEntry> {
    let e: string = "";
    if(expire != null) {
      e = "&expire=" + expire;
    }
    return this.httpClient.put<SubjectEntry>(url + "/show/subjects/" + subjectId + "/expire?token=" + token + e,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public setSubjectLabels(url: string, token: string, subjectId: string, labelIds: string[]): Promise<SubjectEntry> {
    return this.httpClient.put<SubjectEntry>(url + "/show/subjects/" + subjectId + "/labels" + "?token=" + token,
        labelIds, { headers: this.headers, observe: 'body' }).toPromise();
  }

  public setSubjectLabel(url: string, token: string, subjectId: string, labelId: string): Promise<SubjectEntry> {
    return this.httpClient.post<SubjectEntry>(url + "/show/subjects/" + subjectId + "/labels/" + labelId + "?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public clearSubjectLabel(url: string, token: string, subjectId: string, labelId: string): Promise<SubjectEntry> {
    return this.httpClient.delete<SubjectEntry>(url + "/show/subjects/" + subjectId + "/labels/" + labelId + "?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public removeSubject(url: string, token: string, subjectId: string): Promise<void> {
    return this.httpClient.delete<void>(url + "/show/subjects/" + subjectId + "?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public removeSubjectAsset(url: string, token: string, subjectId: string, assetId: string): Promise<SubjectEntry> {
    return this.httpClient.delete<SubjectEntry>(url + "/show/subjects/" + subjectId + "/assets/" + assetId + "?token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public getSubjectTags(url: string, token: string, subjectId: string, schema: string): Promise<SubjectTag> {
    return this.httpClient.get<SubjectTag>(url + "/show/subjects/" + subjectId + "/tags?schema=" + schema + "&descending=false&token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public addSubjectTag(url: string, token: string, subjectId: string, schema: string, data: string): Promise<SubjectTag> {
    return this.httpClient.post<SubjectTag>(url + "/show/subjects/" + subjectId + "/tags?schema=" + schema + "&descending=false&token=" + token,
        data, { headers: this.headers, observe: 'body' }).toPromise();
  }

  public removeSubjectTag(url: string, token: string, subjectId: string, tagId: string, schema: string): Promise<SubjectTag> {
    return this.httpClient.delete<SubjectTag>(url + "/show/subjects/" + subjectId + "/tags/" + tagId + "?schema=" + schema + "&descending=false&token=" + token,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  public getUploadUrl(url: string, token: string, subjectId: string, transforms: string[]): string {
    let t = encodeURIComponent(transforms.join());
    return url + "/show/subjects/" + subjectId + "/assets?token=" + token + "&transforms=" + t;
  }

  public getAssetUrl(url: string, token: string, subjectId: string, assetId: string): string {
    return url + "/show/subjects/" + subjectId + "/assets/" + assetId + "?token=" + token;
  }
}



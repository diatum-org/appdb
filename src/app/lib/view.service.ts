import { Injectable, Type, Component } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse, HttpEvent } from '@angular/common/http';
import { HttpUrlEncodingCodec } from '@angular/common/http';

import { timeout } from 'rxjs/operators';

import { Subject } from './subject';
import { SubjectView } from './subjectView';
import { AuthMessage } from './authMessage';
import { SubjectTag } from './subjectTag';

@Injectable()
export class ViewService {

  private auth: Map<string, string>;
  private authMessage: AuthMessage = null;
  private authToken: string = null;

  private headers: HttpHeaders;

  constructor(private httpClient: HttpClient) {
    this.auth = new Map<string, string>();
    this.headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Accept': 'application/json' });
  }

  private getAgentMessage(url: string, token: string): Promise<AuthMessage> {
    return this.httpClient.put<AuthMessage>(url + "/agent/service?token=" + token,
      { headers: this.headers, observe: 'body' }).toPromise();
  }

  private setAgentMessage(url: string, token: string, msg: AuthMessage): Promise<string> {
    return this.httpClient.post(url + "/view/agents?token=" + token,
      msg, { headers: this.headers, observe: 'body', responseType: 'text' }).pipe(timeout(5000)).toPromise();
  }


  private viewSubjectViews(url: string, token: string, agent: string, filter: string[]): Promise<SubjectView[]> {
    return this.httpClient.post<SubjectView[]>(url + "/view/subjects/view?token=" + token + "&agent=" + agent,
        filter, { headers: this.headers, observe: 'body'  }).toPromise();
  }

  private authSubjectViews(url: string, token: string, filter: string[]): Promise<SubjectView[]> {

    return new Promise<SubjectView[]>((resolve, reject) => {
      // send auth message if not set
      if(!this.auth.has(url)) {
        this.setAgentMessage(url, token, this.authMessage).then(t => {
          this.auth.set(url, t);
          this.viewSubjectViews(url, token, this.auth.get(url), filter).then(a => {
            resolve(a);
          }).catch(err => {
            reject(JSON.stringify(err));
          });
        }).catch(err => {
          reject(JSON.stringify(err));
        });
      }
      else {
        this.viewSubjectViews(url, token, this.auth.get(url), filter).then(a => {
          resolve(a);
        }).catch(err => {
          // TODO only retry on 402
          this.setAgentMessage(url, token, this.authMessage).then(t => {
            this.auth.set(url, t);
            this.viewSubjectViews(url, token, this.auth.get(url), filter).then(a => {
              resolve(a);
            }).catch(err => {
              reject(JSON.stringify(err));
            });
          }).catch(err => {
            reject(JSON.stringify(err));
          });
        });
      }
    });
  }

  public getSubjectViews(serviceUrl: string, serviceToken: string, nodeUrl: string, nodeToken: string, filter: string[]): Promise<SubjectView[]> {

    return new Promise<SubjectView[]>((resolve, reject) => {
      // retrieve auth message if not set
      if(this.authMessage == null) {
        this.getAgentMessage(serviceUrl, serviceToken).then(m => {
          this.authMessage = m;
          this.authSubjectViews(nodeUrl, nodeToken, filter).then(a => {
            resolve(a);
          }).catch(err => {
            reject(JSON.stringify(err));
          });
        }).catch(err => {
          reject(JSON.stringify(err));
        });
      }
      else {
        this.authSubjectViews(nodeUrl, nodeToken, filter).then(a => {
          resolve(a);
        }).catch(err => {
          // TODO only retry on 402
          this.getAgentMessage(serviceUrl, serviceToken).then(m => {
            this.authMessage = m;
            this.authSubjectViews(nodeUrl, nodeToken, filter).then(a => {
              resolve(a);
            }).catch(err => {
              reject(JSON.stringify(err));
            });
          }).catch(err => {
            reject(JSON.stringify(err));
          });
        });
      }
    });
  }

  private viewSubject(url: string, token: string, agent: string, subjectId: string): Promise<Subject> {
    return this.httpClient.get<Subject>(url + "/view/subjects/" + subjectId + "?token=" + token + "&agent=" + agent,
        { headers: this.headers, observe: 'body'  }).toPromise();
  }

  private authSubject(url: string, token: string, subjectId: string): Promise<Subject> {

    return new Promise<Subject>((resolve, reject) => {
      // send auth message if not set
      if(!this.auth.has(url)) {
        this.setAgentMessage(url, token, this.authMessage).then(t => {
          this.auth.set(url, t);
          this.viewSubject(url, token, this.auth.get(url), subjectId).then(a => {
            resolve(a);
          }).catch(err => {
            reject(JSON.stringify(err));
          });
        }).catch(err => {
          reject(JSON.stringify(err));
        });
      }
      else {
        this.viewSubject(url, token, this.auth.get(url), subjectId).then(a => {
          resolve(a);
        }).catch(err => {
          // TODO only retry on 402
          this.setAgentMessage(url, token, this.authMessage).then(t => {
            this.auth.set(url, t);
            this.viewSubject(url, token, this.auth.get(url), subjectId).then(a => {
              resolve(a);
            }).catch(err => {
              reject(JSON.stringify(err));
            });
          }).catch(err => {
            reject(JSON.stringify(err));
          });
        });
      }
    });
  }

  public getSubject(serviceUrl: string, serviceToken: string, nodeUrl: string, nodeToken: string, subjectId: string): Promise<Subject> {

    return new Promise<Subject>((resolve, reject) => {
      // retrieve auth message if not set
      if(this.authMessage == null) {
        this.getAgentMessage(serviceUrl, serviceToken).then(m => {
          this.authMessage = m;
          this.authSubject(nodeUrl, nodeToken, subjectId).then(a => {
            resolve(a);
          }).catch(err => {
            reject(JSON.stringify(err));
          });
        }).catch(err => {
          reject(JSON.stringify(err));
        });
      }
      else {
        this.authSubject(nodeUrl, nodeToken, subjectId).then(a => {
          resolve(a);
        }).catch(err => {
          // TODO only retry on 402
          this.getAgentMessage(serviceUrl, serviceToken).then(m => {
            this.authMessage = m;
            this.authSubject(nodeUrl, nodeToken, subjectId).then(a => {
              resolve(a);
            }).catch(err => {
              reject(JSON.stringify(err));
            });
          }).catch(err => {
            reject(JSON.stringify(err));
          });
        });
      }
    });
  }

  private viewSubjects(url: string, token: string, agent: string, filter: string[]): Promise<Subject[]> {
    return this.httpClient.post<Subject[]>(url + "/view/subjects/filter?token=" + token + "&agent=" + agent,
        filter, { headers: this.headers, observe: 'body'  }).toPromise();
  }

  private authSubjects(url: string, token: string, filter: string[]): Promise<Subject[]> {

    return new Promise<Subject[]>((resolve, reject) => {
      // send auth message if not set
      if(!this.auth.has(url)) {
        this.setAgentMessage(url, token, this.authMessage).then(t => {
          this.auth.set(url, t);
          this.viewSubjects(url, token, this.auth.get(url), filter).then(a => {
            resolve(a);
          }).catch(err => {
            reject(JSON.stringify(err));
          });
        }).catch(err => {
          reject(JSON.stringify(err));
        });
      }
      else {
        this.viewSubjects(url, token, this.auth.get(url), filter).then(a => {
          resolve(a);
        }).catch(err => {
          // TODO only retry on 402
          this.setAgentMessage(url, token, this.authMessage).then(t => {
            this.auth.set(url, t);
            this.viewSubjects(url, token, this.auth.get(url), filter).then(a => {
              resolve(a);
            }).catch(err => {
              reject(JSON.stringify(err));
            });
          }).catch(err => {
            reject(JSON.stringify(err));
          });
        });
      }
    });
  }

  public getSubjects(serviceUrl: string, serviceToken: string, nodeUrl: string, nodeToken: string, filter: string[]): Promise<Subject[]> {

    return new Promise<Subject[]>((resolve, reject) => {
      // retrieve auth message if not set
      if(this.authMessage == null) {
        this.getAgentMessage(serviceUrl, serviceToken).then(m => {
          this.authMessage = m;
          this.authSubjects(nodeUrl, nodeToken, filter).then(a => {
            resolve(a);
          }).catch(err => {
            reject(JSON.stringify(err));
          });
        }).catch(err => {
          reject(JSON.stringify(err));
        });
      }
      else {
        this.authSubjects(nodeUrl, nodeToken, filter).then(a => {
          resolve(a);
        }).catch(err => {
          // TODO only retry on 402
          this.getAgentMessage(serviceUrl, serviceToken).then(m => {
            this.authMessage = m;
            this.authSubjects(nodeUrl, nodeToken, filter).then(a => {
              resolve(a);
            }).catch(err => {
              reject(JSON.stringify(err));
            });
          }).catch(err => {
            reject(JSON.stringify(err));
          });
        });
      }
    });
  }

  private viewGetSubjectTags(url: string, token: string, subjectId: string, schema: string, agent: string): Promise<SubjectTag> {
    return this.httpClient.get<SubjectTag>(url + "/view/subjects/" + subjectId + "/tags?schema=" + schema + "&descending=false&token=" + token + "&agent=" + agent,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  private authGetSubjectTags(url: string, token: string, subjectId: string, schema: string): Promise<SubjectTag> {

    return new Promise<SubjectTag>((resolve, reject) => {
      // send auth message if not set
      if(!this.auth.has(url)) {
        this.setAgentMessage(url, token, this.authMessage).then(t => {
          this.auth.set(url, t);
          this.viewGetSubjectTags(url, token, subjectId, schema, this.auth.get(url)).then(a => {
            resolve(a);
          }).catch(err => {
            reject(JSON.stringify(err));
          });
        }).catch(err => {
          reject(JSON.stringify(err));
        });
      }
      else {
        this.viewGetSubjectTags(url, token, subjectId, schema, this.auth.get(url)).then(a => {
          resolve(a);
        }).catch(err => {
          // TODO only retry on 402
          this.setAgentMessage(url, token, this.authMessage).then(t => {
            this.auth.set(url, t);
            this.viewGetSubjectTags(url, token, subjectId, schema, this.auth.get(url)).then(a => {
              resolve(a);
            }).catch(err => {
              reject(JSON.stringify(err));
            });
          }).catch(err => {
            reject(JSON.stringify(err));
          });
        });
      }
    });
  }

  public getSubjectTags(serviceUrl: string, serviceToken: string, nodeUrl: string, nodeToken: string, subjectId: string, schema: string): Promise<SubjectTag> {

    return new Promise<SubjectTag>((resolve, reject) => {
      // retrieve auth message if not set
      if(this.authMessage == null) {
        this.getAgentMessage(serviceUrl, serviceToken).then(m => {
          this.authMessage = m;
          this.authGetSubjectTags(nodeUrl, nodeToken, subjectId, schema).then(a => {
            resolve(a);
          }).catch(err => {
            reject(JSON.stringify(err));
          });
        }).catch(err => {
          reject(JSON.stringify(err));
        });
      }
      else {
        this.authGetSubjectTags(nodeUrl, nodeToken, subjectId, schema).then(a => {
          resolve(a);
        }).catch(err => {
          // TODO only retry on 402
          this.getAgentMessage(serviceUrl, serviceToken).then(m => {
            this.authMessage = m;
            this.authGetSubjectTags(nodeUrl, nodeToken, subjectId, schema).then(a => {
              resolve(a);
            }).catch(err => {
              reject(JSON.stringify(err));
            });
          }).catch(err => {
            reject(JSON.stringify(err));
          });
        });
      }
    });
  }

  private viewAddSubjectTags(url: string, token: string, subjectId: string, schema: string, data: string, agent: string): Promise<SubjectTag> {
    return this.httpClient.post<SubjectTag>(url + "/view/subjects/" + subjectId + "/tags?schema=" + schema + "&descending=false&token=" + token + "&agent=" + agent,
        data, { headers: this.headers, observe: 'body' }).toPromise();
  }

  private authAddSubjectTags(url: string, token: string, subjectId: string, schema: string, data: string): Promise<SubjectTag> {

    return new Promise<SubjectTag>((resolve, reject) => {
      // send auth message if not set
      if(!this.auth.has(url)) {
        this.setAgentMessage(url, token, this.authMessage).then(t => {
          this.auth.set(url, t);
          this.viewAddSubjectTags(url, token, subjectId, schema, data, this.auth.get(url)).then(a => {
            resolve(a);
          }).catch(err => {
            reject(JSON.stringify(err));
          });
        }).catch(err => {
          reject(JSON.stringify(err));
        });
      }
      else {
        this.viewAddSubjectTags(url, token, subjectId, schema, data, this.auth.get(url)).then(a => {
          resolve(a);
        }).catch(err => {
          // TODO only retry on 402
          this.setAgentMessage(url, token, this.authMessage).then(t => {
            this.auth.set(url, t);
            this.viewAddSubjectTags(url, token, subjectId, schema, data, this.auth.get(url)).then(a => {
              resolve(a);
            }).catch(err => {
              reject(JSON.stringify(err));
            });
          }).catch(err => {
            reject(JSON.stringify(err));
          });
        });
      }
    });
  }

  public addSubjectTags(serviceUrl: string, serviceToken: string, nodeUrl: string, nodeToken: string, subjectId: string, schema: string, data: string): Promise<SubjectTag> {

    return new Promise<SubjectTag>((resolve, reject) => {
      // retrieve auth message if not set
      if(this.authMessage == null) {
        this.getAgentMessage(serviceUrl, serviceToken).then(m => {
          this.authMessage = m;
          this.authAddSubjectTags(nodeUrl, nodeToken, subjectId, schema, data).then(a => {
            resolve(a);
          }).catch(err => {
            reject(JSON.stringify(err));
          });
        }).catch(err => {
          reject(JSON.stringify(err));
        });
      }
      else {
        this.authAddSubjectTags(nodeUrl, nodeToken, subjectId, schema, data).then(a => {
          resolve(a);
        }).catch(err => {
          // TODO only retry on 402
          this.getAgentMessage(serviceUrl, serviceToken).then(m => {
            this.authMessage = m;
            this.authAddSubjectTags(nodeUrl, nodeToken, subjectId, schema, data).then(a => {
              resolve(a);
            }).catch(err => {
              reject(JSON.stringify(err));
            });
          }).catch(err => {
            reject(JSON.stringify(err));
          });
        });
      }
    });
  }

  private viewRemoveSubjectTags(url: string, token: string, subjectId: string, tagId: string, schema: string, agent: string): Promise<SubjectTag> {
    return this.httpClient.delete<SubjectTag>(url + "/view/subjects/" + subjectId + "/tags/" + tagId + "?schema=" + schema + "&descending=false&token=" + token + "&agent=" + agent,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  private authRemoveSubjectTags(url: string, token: string, subjectId: string, tagId: string, schema: string): Promise<SubjectTag> {

    return new Promise<SubjectTag>((resolve, reject) => {
      // send auth message if not set
      if(!this.auth.has(url)) {
        this.setAgentMessage(url, token, this.authMessage).then(t => {
          this.auth.set(url, t);
          this.viewRemoveSubjectTags(url, token, subjectId, tagId, schema, this.auth.get(url)).then(a => {
            resolve(a);
          }).catch(err => {
            reject(JSON.stringify(err));
          });
        }).catch(err => {
          reject(JSON.stringify(err));
        });
      }
      else {
        this.viewRemoveSubjectTags(url, token, subjectId, tagId, schema, this.auth.get(url)).then(a => {
          resolve(a);
        }).catch(err => {
          // TODO only retry on 402
          this.setAgentMessage(url, token, this.authMessage).then(t => {
            this.auth.set(url, t);
            this.viewRemoveSubjectTags(url, token, subjectId, tagId, schema, this.auth.get(url)).then(a => {
              resolve(a);
            }).catch(err => {
              reject(JSON.stringify(err));
            });
          }).catch(err => {
            reject(JSON.stringify(err));
          });
        });
      }
    });
  }

  public removeSubjectTags(serviceUrl: string, serviceToken: string, nodeUrl: string, nodeToken: string, subjectId: string, tagId: string, schema: string): Promise<SubjectTag> {

    return new Promise<SubjectTag>((resolve, reject) => {
      // retrieve auth message if not set
      if(this.authMessage == null) {
        this.getAgentMessage(serviceUrl, serviceToken).then(m => {
          this.authMessage = m;
          this.authRemoveSubjectTags(nodeUrl, nodeToken, subjectId, tagId, schema).then(a => {
            resolve(a);
          }).catch(err => {
            reject(JSON.stringify(err));
          });
        }).catch(err => {
          reject(JSON.stringify(err));
        });
      }
      else {
        this.authRemoveSubjectTags(nodeUrl, nodeToken, subjectId, tagId, schema).then(a => {
          resolve(a);
        }).catch(err => {
          // TODO only retry on 402
          this.getAgentMessage(serviceUrl, serviceToken).then(m => {
            this.authMessage = m;
            this.authRemoveSubjectTags(nodeUrl, nodeToken, subjectId, tagId, schema).then(a => {
              resolve(a);
            }).catch(err => {
              reject(JSON.stringify(err));
            });
          }).catch(err => {
            reject(JSON.stringify(err));
          });
        });
      }
    });
  }

  private viewRevision(url: string, token: string, agent: string): Promise<number> {
    return this.httpClient.get<number>(url + "/view/revision?token=" + token + "&agent=" + agent,
        { headers: this.headers, observe: 'body' }).toPromise();
  }

  private authRevision(url: string, token: string): Promise<number> {

    return new Promise<number>((resolve, reject) => {
      // send auth message if not set
      if(!this.auth.has(url)) {
        this.setAgentMessage(url, token, this.authMessage).then(t => {
          this.auth.set(url, t);
          this.viewRevision(url, token, this.auth.get(url)).then(a => {
            resolve(a);
          }).catch(err => {
            reject(JSON.stringify(err));
          });
        }).catch(err => {
          reject(JSON.stringify(err));
        });
      }
      else {
        this.viewRevision(url, token, this.auth.get(url)).then(a => {
          resolve(a);
        }).catch(err => {
          // TODO only retry on 402
          this.setAgentMessage(url, token, this.authMessage).then(t => {
            this.auth.set(url, t);
            this.viewRevision(url, token, this.auth.get(url)).then(a => {
              resolve(a);
            }).catch(err => {
              reject(JSON.stringify(err));
            });
          }).catch(err => {
            reject(JSON.stringify(err));
          });
        });
      }
    });
  }

  public getRevision(serviceUrl: string, serviceToken: string, nodeUrl: string, nodeToken: string): Promise<number> {

    return new Promise<number>((resolve, reject) => {
      // retrieve auth message if not set
      if(this.authMessage == null) {
        this.getAgentMessage(serviceUrl, serviceToken).then(m => {
          this.authMessage = m;
          this.authRevision(nodeUrl, nodeToken).then(a => {
            resolve(a);
          }).catch(err => {
            reject(JSON.stringify(err));
          });
        }).catch(err => {
          reject(JSON.stringify(err));
        });
      }
      else {
        this.authRevision(nodeUrl, nodeToken).then(a => {
          resolve(a);
        }).catch(err => {
          // TODO only retry on 402
          this.getAgentMessage(serviceUrl, serviceToken).then(m => {
            this.authMessage = m;
            this.authRevision(nodeUrl, nodeToken).then(a => {
              resolve(a);
            }).catch(err => {
              reject(JSON.stringify(err));
            });
          }).catch(err => {
            reject(JSON.stringify(err));
          });
        });
      }
    });
  }

  public async getAssetUrl(serviceUrl: string, serviceToken: string, nodeUrl: string, nodeToken: string, subjectId: string, assetId: string): Promise<string> {

    // TODO optimize with just a validating enpoint instead of revision check
    await this.getRevision(serviceUrl, serviceToken, nodeUrl, nodeToken);

    return nodeUrl + "/view/subjects/" + subjectId + "/assets/" + assetId + "?token=" + nodeToken + 
        "&agent=" + this.auth.get(nodeUrl);
  }

  public clearAuth(): void {
    this.authMessage = null;
    this.authToken = null;
    this.auth = new Map<string, string>();
  }

}


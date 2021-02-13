import { Injectable, Type, Component } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import * as  base64 from "base-64";
import * as utf8 from "utf8";
var sqlite = require("nativescript-sqlite");

import { Emigo } from './emigo';
import { EmigoView } from './emigoView';
import { EmigoEntry } from './emigoEntry';
import { AttributeView } from './attributeView';
import { Attribute } from './attribute';
import { AttributeEntry } from './attributeEntry';
import { SubjectView } from './subjectView';
import { Subject } from './subject';
import { SubjectEntry } from './subjectEntry';
import { LabelEntry } from './labelEntry';
import { ShareEntry } from './shareEntry';
import { PendingEmigo } from './pendingEmigo';
import { PendingEmigoView } from './pendingEmigoView';
import { LabelView } from './labelView';
import { ShareView } from './shareView';
import { Tag } from './tag';

import { EmigoContact } from './emigoContact';
import { PendingContact } from './pendingContact';
import { FeedSubject } from './feedSubject';
import { FeedSubjectEntry } from './feedSubjectEntry';

export class IdRevision {
  id: string;
  revision: number;
}

export class EmigoUpdate {
  emigoId: string;
  node: string;
  registry: string;
  identityRevision: number;
  attributeRevision: number;
  subjectRevision: number;
  shareStatus: string;
  token: string;
}

@Injectable()
export class StoreService {
  private database: any = null;

  constructor() {
  }

  private decodeText(s: string): any {
    if(s == null) {
      return null;
    }
    return utf8.decode(base64.decode(s));
  }

  private encodeText(o: string): string {
    if(o == null) {
      return "null";
    }
    return "'" + base64.encode(utf8.encode(o)) + "'";
  }

  private decodeObject(s: string): any {
    if(s == null) {
      return null;
    }
    return JSON.parse(utf8.decode(base64.decode(s)));
  }

  private encodeObject(o: any): string {
    if(o == null) {
      return "null";
    }
    return "'" + base64.encode(utf8.encode(JSON.stringify(o))) + "'";
  }

  public async init(name: string): Promise<any> {

    // allocate database
    this.database = await (new sqlite(name));
    
    // create app table
    await this.createAppTable();

    // retrieve app context
    return await this.initAppContext();
  }

  public async setAccount(id: string): Promise<any> {

    // create tables for account id
    await this.createConfigTable(id);
    await this.createLabelTable(id);
    await this.createEmigoTable(id);
    await this.createEmigoLabelTable(id);
    await this.createPendingTable(id);
    await this.createProfileTable(id);
    await this.createProfileLabelTable(id);
    await this.createContactTable(id);
    await this.createShowTable(id);
    await this.createShowLabelTable(id);
    await this.createViewTable(id);
    await this.createShareTable(id);

    // retrieve app account
    return await this.initAppAccount(id);
  }

  private async createAppTable() {

    let cmd: string = "create table if not exists app (key text, value text, unique(key))";
    await this.database.execSQL(cmd);
  }

  private async initAppContext(): Promise<any> {
  
    let cmd: string = "insert or ignore into app (key, value) values ('context', null)";
    await this.database.execSQL(cmd);
    return this.getAppContext();
  }

  private async createConfigTable(id: string) {

    let cmd: string = "create table if not exists config_" + id + " (key text, value text null, unique(key))";
    await this.database.execSQL(cmd);
  }

  private async createLabelTable(id: string) {
  
    let cmd: string = "create table if not exists label_" + id + " (label_id text, revision integer, name text, unique(label_id))";
    await this.database.execSQL(cmd);
  }

  private async createEmigoTable(id: string) {

    let cmd: string = "create table if not exists emigo_" + id + " (emigo_id text unique, revision integer, node text, registry text, name text, handle text, emigo text, identity_revision, attribute_revision integer, subject_revision integer, update_timestamp integer, emigo_error integer, attribute_error integer, subject_error integer, hide integer, app_identity text, app_attribute text, app_subject text, notes text, searchable text, unique(emigo_id))";
    await this.database.execSQL(cmd);
  }

  private async createPendingTable(id: string) {

    let cmd: string = "create table if not exists pending_" + id + " (share_id text unique, revision integer, message text, updated integer, app_share text)";
    await this.database.execSQL(cmd);
  }

  private async createEmigoLabelTable(id: string) {

    let cmd: string = "create table if not exists emigolabel_" + id + " (label_id text, emigo_id text, unique (label_id, emigo_id))";
    await this.database.execSQL(cmd);
  }

  private async createProfileTable(id: string) {
    
    let cmd: string = "create table if not exists profile_" + id + " (attribute_id text, revision integer, schema text, data text, unique(attribute_id))";
    await this.database.execSQL(cmd);
  }

  private async createProfileLabelTable(id: string) {

    let cmd: string = "create table if not exists profilelabel_" + id + " (label_id text, attribute_id text, unique (label_id, attribute_id))";
    await this.database.execSQL(cmd);
  }

  private async createContactTable(id: string) {
  
    let cmd: string = "create table if not exists contact_" + id + " (emigo_id text, attribute_id text, revision integer, schema text, data text, unique(emigo_id, attribute_id))";
    await this.database.execSQL(cmd);
  }

  private async createShowTable(id: string) {
  
    let cmd: string = "create table if not exists show_" + id + " (subject_id text, revision integer, tag_revision integer, created integer, modified integer, expires integer, schema text, data text, tags text, tag_count integer, share integer, ready integer, assets text, originals text, app_subject text, searchable text, unique(subject_id))";
    await this.database.execSQL(cmd);
  }

  private async createShowLabelTable(id: string) {
  
    let cmd: string = "create table if not exists showlabel_" + id + " (label_id text, subject_id text, subject text, unique (label_id, subject_id))";
    await this.database.execSQL(cmd);
  }

  private async createViewTable(id: string) {
    
    let cmd: string = "create table if not exists view_" + id + " (emigo_id text, subject_id text, revision integer, tag_revision integer, created integer, modified integer, expires integer, schema text, data text, tags text, tag_count integer, hide integer, app_subject text, searchable text, unique(emigo_id, subject_id))";
    await this.database.execSQL(cmd);
  }

  private async createShareTable(id: string) {
  
    let cmd: string = "create table if not exists share_" + id + " (emigo_id text, share_id text, revision integer, status text, token text, updated integer, app_share text, unique(emigo_id), unique(share_id))"
    await this.database.execSQL(cmd);
  }

  private async initAppAccount(id: string): Promise<any> {
  
    let cmd: string = "insert or ignore into app (key, value) values ('account_" + id + "', null)";
    await this.database.execSQL(cmd);
    return await this.getAppAccount(id);
  }

  public async getAppContext(): Promise<any> {
    
    let cmd: string = "select value from app where key='context'";
    let rows = await this.database.all(cmd);
    return this.decodeObject(rows[0][0]); 
  }

  public async setAppContext(obj: any) {
    
    let data: string = this.encodeObject(obj);
    let cmd: string = "update app set value=" + data + " where key='context'";
    await this.database.execSQL(cmd);
  }

  public async clearAppContext() {
    
    let cmd: string = "update app set value=null where key='context'";
    await this.database.execSQL(cmd);
  }

  public async getAppAccount(id: string): Promise<any> {

    let cmd: string = "select value from app where key='account_" + id + "'";
    let rows = await this.database.all(cmd);
    if(rows.length == 0) {
      return null;
    }
    return this.decodeObject(rows[0][0]);
  }

  public async setAppAccount(id: string, obj: any) {

    let data: string = this.encodeObject(obj);
    let insert: string = "insert or ignore into app (key, value) values ('account_" + id + "', " + data + ")";
    let update: string = "update app set value=" + data + " where key='account_" + id + "'";
    await this.database.execSQL(insert);
    await this.database.execSQL(update);
  }

  public async clearAppAccount(id: string) {

    let cmd: string = "update app set value=null where key='account_" + id + "'";
    await this.database.execSQL(cmd);
  }

  public async getAppProperty(id: string, key: string): Promise<any> {

    let cmd: string = "select value from app where key='prop_" + key + "_" +id + "'";
    let rows = await this.database.all(cmd);
    if(rows.length == 0) {
      return null;
    }
    return this.decodeObject(rows[0][0]);
  }

  public async setAppProperty(id: string, key: string, obj: any) {

    // inefficient upsert solution
    let data: string = this.encodeObject(obj);
    let insert: string = "insert or ignore into app (key, value) values ('prop_" + key + "_" + id + "', " + data + ")";
    let update: string = "update app set value=" + data + " where key='prop_" + key + "_" + id + "'";
    await this.database.execSQL(insert);
    await this.database.execSQL(update);
  }

  public async clearAppProperty(id: string, key: string) {

    let cmd: string = "update app set value=null where key='prop_" + key + "_" + id + "'";
    await this.database.execSQL(cmd);
  }


  // group module synchronization

  public async getLabel(id: string, labelId: string): Promise<LabelEntry> {

    let cmd: string = "select label_id, revision, name from label_" + id + " where label_id='" + labelId + "'";
    let rows = await this.database.all(cmd);
    let label: LabelEntry = null;
    for(let i = 0; i < rows.length; i++) {
      label = {
        labelId: rows[i][0],
        revision: rows[i][1],
        name: this.decodeText(rows[i][2]),
      };
    }
    return label;
  }

  public async getLabels(id: string): Promise<LabelEntry[]> {
     
    let cmd: string = "select label_id, revision, name from label_" + id;
    let rows = await this.database.all(cmd);
    let labels: LabelEntry[] = [];
    for(let i = 0; i < rows.length; i++) {
      labels.push({
        labelId: rows[i][0],
        revision: rows[i][1],
        name: this.decodeText(rows[i][2]),
      });
    }
    return labels;
  }

  public async getLabelViews(id: string): Promise<LabelView[]> {

    let cmd: string = "select label_id, revision from label_" + id;
    let rows = await this.database.all(cmd);
    let revisions: LabelView[] = [];
    for(let i = 0; i < rows.length; i++) {
      revisions.push({
        labelId: rows[i][0],
        revision: rows[i][1]
      });
    }
    return revisions;
  }

  public async addLabel(id: string, entry: LabelEntry) {
  
    let cmd: string = "insert or ignore into label_" + id + " (label_id, revision, name) values ('" + entry.labelId + "', " + entry.revision + ", " + this.encodeText(entry.name) + ")";
    await this.database.execSQL(cmd);
  }

  public async updateLabel(id: string, entry: LabelEntry) {

    let cmd: string = "update label_" + id + " set name=" + this.encodeText(entry.name) + ", revision=" + entry.revision + " where label_id='" + entry.labelId + "'";
    await this.database.execSQL(cmd);
  }

  public async removeLabel(id: string, labelId: string) {

    let cmd: string = "delete from label_" + id + " where label_id='" + labelId + "'";
    await this.database.execSQL(cmd);
  }


  // share module synchronization  

  public async getConnections(id: string): Promise<ShareEntry[]> {
  
    let cmd: string = "select emigo_id, share_id, revision, status, token, updated from share_" + id;
    let rows = await this.database.all(cmd);
    let shares: ShareEntry[] = [];
    for(let i = 0; i < rows.length; i++) {
      shares.push({
        emigoId: rows[i][0],
        shareId: rows[i][1],
        revision: rows[i][2],
        status: rows[i][3],
        token: rows[i][4],
        updated: rows[i][5]
      });
    }
    return shares;
  }

  public async getConnectionViews(id: string): Promise<ShareView[]> {

    let cmd: string = "select share_id, revision from share_" + id;
    let rows = await this.database.all(cmd);
    let revisions: ShareView[] = [];
    for(let i = 0; i < rows.length; i++) {
      revisions.push({
        shareId: rows[i][0],
        revision: rows[i][1]
      });
    }
    return revisions;
  }

  public async addConnection(id: string, entry: ShareEntry) {

    let cmd: string = "insert or ignore into share_" + id + " (emigo_id, share_id, revision, status, token, updated) values ('" + entry.emigoId + "', '" + entry.shareId + "', " + entry.revision + ", '" + entry.status + "', '" + entry.token + "', " + entry.updated + ")";
    await this.database.execSQL(cmd);
  }

  public async updateConnection(id: string, entry: ShareEntry) {

    let cmd: string = "update share_" + id + " set emigo_id='" + entry.emigoId + "', revision=" + entry.revision + ", status='" + entry.status + "', token='" + entry.token + "', updated=" + entry.updated + " where share_id='" + entry.shareId + "'";
    await this.database.execSQL(cmd);
  }

  public async removeConnection(id: string, shareId: string) {

    let cmd: string = "delete from share_" + id + " where share_id='" + shareId + "'";
    await this.database.execSQL(cmd);
  }


  // index module synchronization

  public async getEmigo(id: string, emigoId: string): Promise<EmigoEntry> {

    // get labels
    let label: string = "select label_id from emigolabel_" + id + " where emigo_id='" + emigoId + "'";
    let labelRows = await this.database.all(label);
    let labels: string[] = [];
    for(let i = 0; i < labelRows.length; i++) {
      labels.push(labelRows[i][0]);
    }

    // get notes and revision  
    let entry: string = "select emigo_id, revision, notes from emigo_" + id + " where emigo_id='" + emigoId + "'";
    let rows = await this.database.all(entry);
    let emigo: EmigoEntry = null;
    for(let i = 0; i < rows.length; i++) {
      emigo = {
        emigoId: rows[i][0],
        revision: rows[i][1],
        notes: this.decodeText(rows[i][2]),
        labels: labels,
      };
    }

    return emigo;
  }

  public async getEmigos(id: string): Promise<EmigoEntry[]> {

    // get labels 
    let label: string = "select emigo_id, label_id from emigolabel_" + id;
    let labelRows = await this.database.all(label);
    let views: Map<string, string[]> = new Map<string, string[]>();
    for(let i = 0; i < labelRows.length; i++) {
      if(views.has(labelRows[i][0])) {
        views.get(labelRows[i][0]).push(labelRows[i][1]);
      }
      else {
        views.set(labelRows[i][0], [ labelRows[i][1] ]);
      }
    }
 
    // get notes and revision
    let entry: string = "select emigo_id, revision, notes from emigo_" + id;
    let rows = await this.database.all(entry);
    let emigos: EmigoEntry[] = [];
    for(let i = 0; i < rows.length; i++) {
      emigos.push({
        emigoId: rows[i][0],
        revision: rows[i][1],
        notes: this.decodeText(rows[i][2]),
        labels: views.has(rows[i][0]) ? views.get(rows[i][0]) : [],
      });
    }
    return emigos;
  }

  public async getEmigoViews(id: string): Promise<EmigoView[]> {

    let cmd: string = "select emigo_id, revision from emigo_" + id;
    let rows = await this.database.all(cmd);
    let revisions: EmigoView[] = [];
    for(let i = 0; i < rows.length; i++) {
      revisions.push({
        emigoId: rows[i][0],
        revision: rows[i][1]
      });
    }
    return revisions;
  }

  public async addEmigo(id: string, emigoId: string, notes: string, revision: number) {

    let cmd: string = "insert or ignore into emigo_" + id + " (emigo_id, revision, hide, notes) values ('" + emigoId + "', " + revision + ", 0, " + this.encodeText(notes) + ")";
    await this.database.execSQL(cmd);
  }

  public async updateEmigo(id: string, emigoId: string, notes: string, revision: number) {

    let cmd: string = "update emigo_" + id + " set revision=" + revision + ", notes=" + this.encodeText(notes) + " where emigo_id='" + emigoId + "'";
    await this.database.execSQL(cmd);
  }

  public async removeEmigo(id: string, emigoId: string) {

    // commercial sqlite will allow for this to be a transaction    

    let cmd: string = "delete from emigo_" + id + " where emigo_id='" + emigoId + "'";
    await this.database.execSQL(cmd);

    let label: string = "delete from emigolabel_" + id + " where emigo_id='" + emigoId + "'";
    await this.database.execSQL(label);

    let share: string = "delete from share_" + id + " where emigo_id='" + emigoId + "'"
    await this.database.execSQL(share);

    let contact: string = "delete from contact_" + id + " where emigo_id='" +  emigoId + "'";
    await this.database.execSQL(contact);

    let view: string = "delete from view_" + id + " where emigo_id='" + emigoId + "'";
    await this.database.execSQL(view);
  }

  public async setEmigoLabel(id: string, emigoId: string, labelId: string) {

    let cmd: string = "insert or ignore into emigolabel_" + id + " (emigo_id, label_id) values ('" + emigoId + "', '" + labelId + "')";
    await this.database.execSQL(cmd);
  }

  public async clearEmigoLabels(id: string, emigoId) {

    let cmd: string = "delete from emigolabel_" + id + " where emigo_id='" + emigoId + "'";
    await this.database.execSQL(cmd);
  }

  public async getPendingContacts(id: string): Promise<PendingContact[]> {
    
    let cmd: string = "select share_id, revision, updated, app_share from pending_" + id + " order by updated";
    let rows = await this.database.all(cmd);
    let emigos: PendingContact[] = [];
    for(let i = 0; i < rows.length; i++) {
      emigos.push({
        shareId: rows[i][0],
        revision: rows[i][1],
        updated: rows[i][2],
        pendingData: this.decodeObject(rows[i][3]),
      });
    }
    return emigos;
  }

  public async getPendingViews(id: string): Promise<PendingEmigoView[]> {
    
    let cmd: string = "select share_id, revision from pending_" + id;
    let rows = await this.database.all(cmd);
    let shares: PendingEmigoView[] = [];
    for(let i = 0; i < rows.length; i++) {
      shares.push({ shareId: rows[i][0], revision: rows[i][1] });
    }
    return shares;
  }

  public async getPending(id: string, shareId: string): Promise<PendingEmigo> {
    
    let cmd: string = "select share_id, revision, message, updated from pending_" + id + " where share_id='" + shareId + "'";
    let rows = await this.database.all(cmd);
    let emigo: PendingEmigo = null;
    for(let i = 0; i < rows.length; i++) {
      emigo = {
        shareId: rows[i][0],
        revision: rows[i][1],
        message: this.decodeObject(rows[i][2]),
        updated: rows[i][3],
      };
    }
    return emigo;
  }

  public async addPending(id: string, emigo: PendingEmigo) {
  
    let cmd: string = "insert or ignore into pending_" + id + " (share_id, message, revision, updated) values ('" + emigo.shareId + "', " + this.encodeObject(emigo.message) + ", " + emigo.revision + ", " + emigo.updated + ")";
    await this.database.execSQL(cmd);
  }

  public async updatePending(id: string, shareId: string, emigo: PendingEmigo) {

    if(shareId != emigo.shareId) {
      throw new Error("unexpected request share id");
    }

    let cmd: string = "update pending_" + id + " message=" + this.encodeObject(emigo.message) + ", revision=" + emigo.revision + ", updated=" + emigo.updated + " where share_id='" + emigo.shareId + "')";
    await this.database.execSQL(cmd);
  }

  public async removePending(id: string, shareId: string) {

    let cmd: string = "delete from pending_" + id + " where share_id='" + shareId + "'";
    await this.database.execSQL(cmd);
  }


  // profile module synchronization

  public async getAttributes(id: string): Promise<AttributeEntry[]> {

    // get attribute labels 
    let label: string = "select attribute_id, label_id from profilelabel_" + id;
    let lows = await this.database.all(label);
    let views: Map<string, string[]> = new Map<string, string[]>();
    for(let i = 0; i < lows.length; i++) {
      if(views.has(lows[i][0])) {
        views.get(lows[i][0]).push(lows[i][1]);
      }
      else {
        views.set(lows[i][0], [ lows[i][1] ]);
      }
    }

    let cmd: string = "select attribute_id, revision, schema, data from profile_" + id;
    let rows = await this.database.all(cmd);
    let attributes: AttributeEntry[] = [];
    for(let i = 0; i < rows.length; i++) {
      attributes.push({
        attribute: {
          attributeId: rows[i][0],
          revision: rows[i][1],
          schema: rows[i][2],
          data: this.decodeText(rows[i][3]),
        },
        labels: views.has(rows[i][0]) ? views.get(rows[i][0]) : [],
      });
    }
    return attributes;
  }

  public async getAttribute(id: string, attributeId: string): Promise<AttributeEntry> {

    let label: string = "select label_id from profilelabel_" + id + " where attribute_id='" + attributeId + "'";
    let lows = await this.database.all(label);
    let labels: string[] = [];
    for(let i = 0; i < lows.length; i++) {
      labels.push(lows[i][0]);
    }  

    let cmd: string = "select attribute_id, revision, schema, data from profile_" + id + " where attribute_id='" + attributeId + "'";;
    let rows = await this.database.all(cmd);
    let attribute: AttributeEntry = null;
    for(let i = 0; i < rows.length; i++) {
      attribute = {
        attribute: {
          attributeId: rows[i][0],
          revision: rows[i][1],
          schema: rows[i][2],
          data: this.decodeText(rows[i][3]),
        },
        labels: labels,
      };
    }
    return attribute;
  }

  public async getAttributeViews(id: string): Promise<AttributeView[]> {

    let cmd: string = "select attribute_id, revision from profile_" + id;
    let rows = await this.database.all(cmd);
    let revisions: AttributeView[] = [];
    for(let i = 0; i < rows.length; i++) {
      revisions.push({
        attributeId: rows[i][0],
        revision: rows[i][1],
      });
    }
    return revisions;
  }

  public async addAttribute(id: string, entry: Attribute) {
    let cmd: string = "insert or ignore into profile_" + id + " (attribute_id, revision, schema, data) values ('" + entry.attributeId + "', " + entry.revision + ", '" + entry.schema + "', " + this.encodeText(entry.data) + ")";
    await this.database.execSQL(cmd);
  }

  public async updateAttribute(id: string, entry: Attribute) {
    let cmd: string = "update profile_" + id + " set revision=" + entry.revision + ", schema='" + entry.schema + "', data=" + this.encodeText(entry.data) + " where attribute_id='" + entry.attributeId + "'";
    await this.database.execSQL(cmd);
  }

  public async removeAttribute(id: string, attributeId: string) {

    // commercial sqlite will allow for this to be a transaction  

    let cmd: string = "delete from profile_" + id + " where attribute_id='" + attributeId + "'";
    await this.database.execSQL(cmd);

    let view: string = "delete from profilelabel_" + id + " where attribute_id='" + attributeId + "'";
    await this.database.execSQL(view);
  }

  public async setAttributeLabel(id: string, attributeId: string, labelId: string) {
  
    let cmd: string = "insert or ignore into profilelabel_" + id + " (attribute_id, label_id) values ('" + attributeId + "', '" + labelId + "')";
    await this.database.execSQL(cmd);
  }

  public async clearAttributeLabels(id: string, attributeId: string) {
    
    let cmd: string = "delete from profilelabel_" + id + " where attribute_id='" + attributeId + "'";
    await this.database.execSQL(cmd);
  }


  // show module synchronization
   
  public async getSubject(id: string, subjectId: string): Promise<SubjectEntry> {
 
    let vmd: string = "select label_id from showlabel_" + id + " where subject_id='" + subjectId + "'";
    let vows = await this.database.all(vmd);
    let labels: string[] = [];
    for(let i = 0; i < vows.length; i++) {
      labels.push(vows[i][0]);
    }

    let cmd: string = "select subject_id, revision, created, modified, expires, schema, data, share, ready, assets, originals from show_" + id + " where subject_id='" + subjectId + "'";
    let rows = await this.database.all(cmd);
    let subject: SubjectEntry = null;
    for(let i = 0; i < rows.length; i++) {
      subject = {
        subject: {
          subjectId: rows[i][0],
          revision: rows[i][1],
          created: rows[i][2],
          modified: rows[i][3],
          expires: rows[i][4],
          schema: rows[i][5],
          data: this.decodeText(rows[i][6])
        },
        share: rows[i][7] == 0 ? false : true,
        ready: rows[i][8] == 0 ? false : true, 
        assets: this.decodeObject(rows[i][9]),
        originals: this.decodeObject(rows[i][10]),
        labels: labels,
      };
    }
    return subject;
  }

  public async getSubjects(id: string): Promise<SubjectEntry[]> {
 
    let vmd: string = "select subject_id, label_id from showlabel_" + id;
    let vows = await this.database.all(vmd);
    let views: Map<string, string[]> = new Map<string, string[]>();
    for(let i = 0; i < vows.length; i++) {
      if(views.has(vows[i][0])) {
        views.get(vows[i][0]).push(vows[i][1]);
      }
      else {
        views.set(vows[i][0], [ vows[i][1] ]);
      }
    }

    let cmd: string = "select subject_id, revision, created, modified, expires, schema, data, share, ready, assets, originals from show_" + id;
    let rows = await this.database.all(cmd);
    let subjects: SubjectEntry[] = [];
    for(let i = 0; i < rows.length; i++) {
      subjects.push({
        subject: {
          subjectId: rows[i][0],
          revision: rows[i][1],
          created: rows[i][2],
          modified: rows[i][3],
          expires: rows[i][4],
          schema: rows[i][5],
          data: this.decodeText(rows[i][6])
        },
        share: rows[i][7],
        ready: rows[i][8], 
        assets: this.decodeObject(rows[i][9]),
        originals: this.decodeObject(rows[i][10]),
        labels: views.has(rows[i][0]) ? views.get(rows[i][0]) : [],
      });
    }
    return subjects;
  }

  public async getSubjectViews(id: string): Promise<SubjectView[]> {

    let cmd: string = "select subject_id, revision, tag_revision from show_" + id;
    let rows = await this.database.all(cmd);
    let revisions: SubjectView[] = [];
    for(let i = 0; i < rows.length; i++) {
      revisions.push({
        subjectId: rows[i][0],
        revision: rows[i][1],
        tagRevision: rows[i][2]
      });
    }
    return revisions;
  }

  public async addSubject(id: string, entry: SubjectEntry, searchable: any) {
  
    let search: string = "";
    if(entry != null && searchable != null) {
      search = searchable(entry.subject);
    }

    let r: number = entry.ready ? 1 : 0;
    let s: number = entry.share ? 1 : 0;
    let cmd: string = "insert or ignore into show_" + id + " (subject_id, revision, created, modified, expires, schema, searchable, data, share, ready, assets, originals, tag_revision, tag_count) values ('" + entry.subject.subjectId + "', " + entry.subject.revision + ", " + entry.subject.created + ", " + entry.subject.modified + ", " + entry.subject.expires + ", '" + entry.subject.schema + "', '" + search + "', " + this.encodeText(entry.subject.data) + ", " + s + ", " + r + ", " + this.encodeObject(entry.assets) + ", " + this.encodeObject(entry.originals) + ", 0, 0)";
    await this.database.execSQL(cmd);
  }

  public async updateSubject(id: string, entry: SubjectEntry, searchable: any) {

    let search: string = "";
    if(entry != null && searchable != null) {
      search = searchable(entry.subject);
    }

    let r: number = entry.ready ? 1 : 0;
    let s: number = entry.share ? 1 : 0;

    let cmd: string = "update show_" + id + " set revision=" + entry.subject.revision + ", created=" + entry.subject.created + ", modified=" + entry.subject.modified + ", expires=" + entry.subject.expires + ", ready=" + r + ", share=" + s + ", schema='" + entry.subject.schema + "', searchable='" + search + "', data=" + this.encodeText(entry.subject.data) + ", assets=" + this.encodeObject(entry.assets) + ", originals=" + this.encodeObject(entry.originals) + " where subject_id='" + entry.subject.subjectId + "'";
    await this.database.execSQL(cmd);

    await this.clearSubjectLabels(id, entry.subject.subjectId);
    for(let i = 0; i < entry.labels.length; i++) {
      await this.setSubjectLabel(id, entry.subject.subjectId, entry.labels[i]);
    }
  }

  public async updateEmigoSubjectTags(id: string, emigoId: string, subjectId: string, revision: number, tags: Tag[]) {

    let count: number;
    if(tags == null) {
      count = 0;
    }
    else {
      count = tags.length;
    }
    
    let t: string = this.encodeObject(tags);
    let cmd: string = "update view_" + id + " set tag_revision=" + revision + ", tag_count=" + count + ", tags=" + t + " where emigo_id='" + emigoId + "' and subject_id='" + subjectId + "'";
    await this.database.execSQL(cmd);
  }

  public async updateSubjectTags(id: string, subjectId: string, revision: number, tags: Tag[]) {

    let count: number = 0;
    if(tags == null) {
      count = 0;
    }
    else {
      count = tags.length;
    }

    let t: string = this.encodeObject(tags);

    let cmd: string = "update show_" + id + " set tag_revision=" + revision + ", tag_count=" + count + ", tags=" + t + " where subject_id='" + subjectId + "'";
    await this.database.execSQL(cmd);
  }

  public async getEmigoSubjectTags(id: string, emigoId: string, subjectId: string): Promise<Tag[]> {

    let cmd: string = "select tags from view_" + id + " where emigo_id='" + emigoId + "' and subject_id='" + subjectId + "'";
    let rows = await this.database.all(cmd);
    let tags = [];
    for(let i = 0; i < rows.length; i++) {
      tags = this.decodeObject(rows[i][0]);
    }
    return tags;
  }

  public async getSubjectTags(id: string, subjectId: string): Promise<Tag[]> {

    let cmd: string = "select tags from show_" + id + " where subject_id='" + subjectId + "'";
    let rows = await this.database.all(cmd);
    let tags = [];
    for(let i = 0; i < rows.length; i++) {
      tags = this.decodeObject(rows[i][0]);
    }
    return tags;
  }

  public async removeSubject(id: string, subjectId: string) {

    // commercial sqlite will allow for this to be a transaction

    let cmd: string = "delete from show_" + id + " where subject_id='" + subjectId + "'";
    await this.database.execSQL(cmd);

    let view: string = "delete from showlabel_" + id + " where subject_id='" + subjectId + "'";
    await this.database.execSQL(view);
  }

  public async setSubjectLabel(id: string, subjectId: string, labelId: string) {
    
    let cmd: string = "insert or ignore into showlabel_" + id + " (subject_id, label_id) values ('" + subjectId + "', '" + labelId + "')";
    await this.database.execSQL(cmd);
  }

  public async clearSubjectLabels(id: string, subjectId: string) {
    
    let cmd: string = "delete from showlabel_" + id + " where subject_id='" + subjectId + "'";
    await this.database.execSQL(cmd);
  }

  
  // contact synchronization

  public async getEmigoUpdate(id: string, emigo: string): Promise<EmigoUpdate> {

    let cmd: string = "select emigo_" + id + ".emigo_id, node, registry, emigo_" + id + ".identity_revision, attribute_revision, subject_revision, status, token from emigo_" + id + " left outer join share_" + id + " on emigo_" + id + ".emigo_id = share_" + id + ".emigo_id where emigo_" + id + ".emigo_id='" + emigo + "'";
    let rows = await this.database.all(cmd);
    let update: EmigoUpdate = null;
    for(let i = 0; i < rows.length; i++) {
      update = {
        emigoId: rows[i][0],
        node: rows[i][1],
        registry: rows[i][2],
        identityRevision: rows[i][3],
        attributeRevision: rows[i][4],
        subjectRevision: rows[i][5],
        shareStatus: rows[i][6],
        token: rows[i][7]
      };
    }
    return update;
  }

  public async getEmigoUpdates(id: string): Promise<EmigoUpdate[]> {

    let cmd: string = "select emigo_" + id + ".emigo_id, node, registry, emigo_" + id + ".identity_revision, attribute_revision, subject_revision, status, token from emigo_" + id + " left outer join share_" + id + " on emigo_" + id + ".emigo_id = share_" + id + ".emigo_id";
    let rows = await this.database.all(cmd);
    let updates: EmigoUpdate[] = [];
    for(let i = 0; i < rows.length; i++) {
      updates.push({
        emigoId: rows[i][0],
        node: rows[i][1],
        registry: rows[i][2],
        identityRevision: rows[i][3],
        attributeRevision: rows[i][4],
        subjectRevision: rows[i][5],
        shareStatus: rows[i][6],
        token: rows[i][7]
      });
    }
    return updates;
  }

  public async getStaleEmigos(id: string, stale: number): Promise<EmigoUpdate[]> {

    let cmd: string = "select emigo_" + id + ".emigo_id, node, registry, emigo_" + id + ".revision, attribute_revision, subject_revision, status, token from emigo_" + id + " left outer join share_" + id + " on emigo_" + id + ".emigo_id = share_" + id + ".emigo_id where update_timestamp is null or update_timestamp < " + stale + " order by update_timestamp asc";

    let rows = await this.database.all(cmd);
    let updates: EmigoUpdate[] = [];
    for(let i = 0; i < rows.length; i++) {
      updates.push({
        emigoId: rows[i][0],
        node: rows[i][1],
        registry: rows[i][2],
        identityRevision: rows[i][3],
        attributeRevision: rows[i][4],
        subjectRevision: rows[i][5],
        shareStatus: rows[i][6],
        token: rows[i][7]
      });
    }
    return updates;
  }

  public async getEmigoIdentity(id: string, emigoId: string): Promise<Emigo> {
    
    let cmd: string = "select emigo from emigo_" + id + " where emigo_id='" + emigoId + "'";
    let rows = await this.database.all(cmd);
    let emigo: Emigo = null;
    for(let i = 0; i < rows.length; i++) {
      emigo = this.decodeObject(rows[i][0]);
    }
    return emigo;
  }  

  public async setEmigoIdentity(id: string, emigoId: string, emigo: Emigo, searchableEmigo: any) {

    let search: string = "";
    if(searchableEmigo != null) {
      search = searchableEmigo(emigo);
    }

    // sanity check
    if(emigo.emigoId == null || emigo.emigoId != emigoId) {
      throw new Error("invalid emigo id");
    }    

    let u: string = "null";
    if(emigo != null && emigo.name != null) {
      u = "'" + emigo.name.replace(/["',]/g, " ") + "'";
    }
    let h: string = "null";
    if(emigo != null && emigo.handle != null) {
      h = "'" + emigo.handle.replace(/["',]/g, " ") + "'";
    }
    let v: string = "null";
    if(emigo != null && emigo.revision != null) {
      v = emigo.revision.toString();
    }
    let n: string = "null";
    if(emigo != null && emigo.node != null) {
      n = "'" + emigo.node.replace(/["',]/g, " ") + "'";
    }
    let r: string = "null";
    if(emigo != null && emigo.registry != null) {
      r = "'" + emigo.registry.replace(/["',]/g, " ") + "'";
    }

    let cmd: string = "update emigo_" + id + " set identity_revision=" + v + ", node=" + n + ", registry=" + r + ", name=" + u + ", handle=" + h + ", searchable='" + search + "', emigo=" + this.encodeObject(emigo) + " where emigo_id='" + emigoId + "'";
    await this.database.execSQL(cmd);
  }

  public async getEmigoShare(id: string, emigoId: string): Promise<ShareEntry> {

    let cmd: string = "select emigo_id, share_id, revision, status, token, updated from share_" + id + " where emigo_id='" + emigoId + "'";
    let rows = await this.database.all(cmd);
    let share: ShareEntry = null;
    for(let i = 0; i < rows.length; i++) {
      share = {
        emigoId: rows[i][0],
        shareId: rows[i][1],
        revision: rows[i][2],
        status: rows[i][3],
        token: rows[i][4],
        updated: rows[i][5]
      };
    }
    return share;
  }

  public async getEmigoAttributes(id: string, emigoId: string): Promise<Attribute[]> {
  
    let cmd: string = "select attribute_id, revision, schema, data from contact_" + id + " where emigo_id='" + emigoId + "'";
    let rows = await this.database.all(cmd);
    let attributes: Attribute[] = [];
    for(let i = 0; i < rows.length; i++) {
      attributes.push({
        attributeId: rows[i][0],
        revision: rows[i][1],
        schema: rows[i][2],
        data: this.decodeText(rows[i][3])
      });
    }
    return attributes;
  }

  public async getEmigoAttributeViews(id: string, emigoId: string): Promise<AttributeView[]> {
    
    let cmd: string = "select attribute_id, revision from contact_" + id + " where emigo_id='" + emigoId + "'";
    let rows = await this.database.all(cmd);
    let revisions: AttributeView[] = [];
    for(let i = 0; i < rows.length; i++) {
      revisions.push({
        attributeId: rows[i][0],
        revision: rows[i][1]
      });
    }
    return revisions;
  }

  public async addEmigoAttribute(id: string, emigoId: string, entry: Attribute) {

    let cmd: string = "insert or ignore into contact_" + id + " (emigo_id, attribute_id, revision, schema, data) values ('" + emigoId + "', '" + entry.attributeId + "', " + entry.revision + ", '" + entry.schema + "', " + this.encodeText(entry.data) + ")";
    await this.database.execSQL(cmd);
  }

  public async updateEmigoAttribute(id: string, emigoId: string, entry: Attribute) {

    let cmd: string = "update contact_" + id + " set revision=" + entry.revision + ", schema='" + entry.schema + "', data=" + this.encodeText(entry.data) + " where emigo_id='" + emigoId + "' and attribute_id='" + entry.attributeId + "'";
    await this.database.execSQL(cmd);
  }

  public async removeEmigoAttribute(id: string, emigoId: string, attributeId: string) {

    let cmd: string = "delete from contact_" + id + " where emigo_id='" + emigoId + "' and attribute_id='" + attributeId + "'";
    await this.database.execSQL(cmd);
  }

  public async setEmigoAttributeRevision(id: string, emigoId: string, revision: number) {

    let r: string;
    if(revision == null) {
      r = "null"
    }
    else {
      r = revision.toString();
    }

    let cmd: string = "update emigo_" + id + " set attribute_revision=" + r + " where emigo_id='" + emigoId + "'";
    await this.database.execSQL(cmd);
  }

  public async getEmigoSubject(id: string, emigoId: string, subjectId: string): Promise<Subject> {

    let cmd: string = "select subject_id, revision, created, modified, expires, schema, data from contact_" + id + " where emigo_id='" + emigoId + "'";
    let rows = await this.database.all(cmd);
    let subject: Subject = null;
    for(let i = 0; i < rows.length; i++) {
      subject = {
        subjectId: rows[i][0],
        revision: rows[i][1],
        created: rows[i][2],
        modified: rows[i][3],
        expires: rows[i][4],
        schema: rows[i][5],
        data: this.decodeText(rows[i][6])
      };
    }
    return subject;
  }

  public async getEmigoSubjects(id: string, emigoId: string): Promise<Subject[]> {

    let cmd: string = "select subject_id, revision, created, modified, expires, schema, data from contact_" + id + " where emigo_id='" + emigoId + "'";
    let rows = await this.database.all(cmd);
    let subjects: Subject[] = [];
    for(let i = 0; i < rows.length; i++) {
      subjects.push({
        subjectId: rows[i][0],
        revision: rows[i][1],
        created: rows[i][2],
        modified: rows[i][3],
        expires: rows[i][4],
        schema: rows[i][5],
        data: this.decodeText(rows[i][6])
      });
    }
    return subjects;
  }

  public async getEmigoSubjectViews(id: string, emigoId: string): Promise<SubjectView[]> {

    let cmd: string = "select subject_id, revision, tag_revision from view_" + id + " where emigo_id='" + emigoId + "'";
    let rows = await this.database.all(cmd);
    let revisions: SubjectView[] = [];
    for(let i = 0; i < rows.length; i++) {
      revisions.push({
        subjectId: rows[i][0],
        revision: rows[i][1],
        tagRevision: rows[i][2]
      });
    }
    return revisions;
  }

  public async addEmigoSubject(id: string, emigoId: string, entry: Subject, searchable: any) {

    let search: string = "";
    if(entry != null && searchable != null) {
      search = searchable(entry);
    }
 
    let cmd: string = "insert or ignore into view_" + id + " (emigo_id, subject_id, revision, created, modified, expires, schema, searchable, data, hide, tag_revision, tag_count) values ('" + emigoId + "', '" + entry.subjectId + "', " + entry.revision + ", " + entry.created + ", " + entry.modified + ", " + entry.expires + ", '" + entry.schema + "', '" + search + "', " + this.encodeText(entry.data) + ", 0, 0, 0)";
    await this.database.execSQL(cmd);
  }

  public async updateEmigoSubject(id: string, emigoId: string, entry: Subject, searchable: any) {

    let search: string = "";
    if(entry != null && searchable != null) {
      search = searchable(entry);
    }
 
    let cmd: string = "update view_" + id + " set revision=" + entry.revision + ", created=" + entry.created + ", modified=" + entry.modified + ", expires=" + entry.expires + ", schema='" + entry.schema + "', searchable='" + search + "', data=" + this.encodeText(entry.data) + " where emigo_id='" + emigoId + "' and subject_id='" + entry.subjectId + "'";
    await this.database.execSQL(cmd);
  }

  public async removeEmigoSubject(id: string, emigoId: string, subjectId: string) {

    let cmd: string = "delete from view_" + id + " where emigo_id='" + emigoId + "' and subject_id='" + subjectId + "'";
    await this.database.execSQL(cmd);
  }

  public async setEmigoSubjectRevision(id: string, emigoId: string, revision: number) {

    let r: string;
    if(revision == null) {
      r = "null"
    }
    else {
      r = revision.toString();
    }

    let cmd: string = "update emigo_" + id + " set subject_revision=" + r + " where emigo_id='" + emigoId + "'";
    await this.database.execSQL(cmd);
  }

  public async setEmigoUpdateTimestamp(id: string, emigoId: string, timestamp: number) {

    let cmd: string = "update emigo_" + id + " set update_timestamp=" + timestamp + " where emigo_id='" + emigoId + "'";
    await this.database.execSQL(cmd);
  }


  // app customizations

  public async setEmigoFeed(id: string, emigoId: string, hide: boolean) {

    let h: number = hide ? 1 : 0;
    let cmd: string = "update emigo_" + id + " set hide=" + h + " where emigo_id='" + emigoId + "'";
    await this.database.execSQL(cmd); 
  }

  public async setEmigoIdentitySearchable(id: string, emigoId: string, str: string) {
  
    let s: string;
    if(str == null) {
      s = "null";
    }
    else {
      s = "'" + str.replace(/["',]/g, " ") + "'";
    }
    
    let cmd: string = "update emigo_" + id + " set searchable=" + s + " where emigo_id='" + emigoId + "'";
    await this.database.execSQL(cmd);
  }

  public async setEmigoIdentityData(id: string, emigoId: string, obj: any) {

    let cmd: string = "update emigo_" + id + " set app_identity=" + this.encodeObject(obj) + " where emigo_id='" + emigoId + "'";
    await this.database.execSQL(cmd);
  }

  public async setShareData(id: string, shareId: string, obj: any) {
  
    let cmd: string = "update share_" + id + " set app_share=" + this.encodeObject(obj) + " where share_id='" + shareId + "'";
    await this.database.execSQL(cmd);
  } 

  public async setPendingData(id: string, shareId: string, obj: any) {
  
    let cmd: string = "update pending_" + id + " set app_share=" + this.encodeObject(obj) + " where share_id='" + shareId + "'";
    await this.database.execSQL(cmd);
  }

  public async setEmigoAttributeData(id: string, emigoId: string, obj: any) {

    let cmd: string = "update emigo_" + id + " set app_attribute=" + this.encodeObject(obj) + " where emigo_id='" + emigoId + "'";
    await this.database.execSQL(cmd);
  }

  public async setEmigoSubjectData(id: string, emigoId: string, obj: any) {

    let cmd: string = "update emigo_" + id + " set app_subject=" + this.encodeObject(obj) + " where emigo_id='" + emigoId + "'";
    await this.database.execSQL(cmd);
  }

  public async setShowSubjectData(id: string, subjectId: string, obj: any) {

    let cmd: string = "update show_" + id + " set app_subject=" + this.encodeObject(obj) + " where subject_id='" + subjectId + "'";
    await this.database.execSQL(cmd);
  }

  public async setShowSubjectSearchable(id: string, subjectId: string, str: string) {

    let s: string;
    if(str == null) {
      s = "null";
    }
    else {
      s = "'" + str.replace(/["',]/g, " ") + "'";
    } 

    let cmd: string = "update view_" + id + " set searchable=" + s + " where subject_id='" + subjectId + "'";
  }

  public async setViewSubjectFeed(id: string, emigoId: string, subjectId: string, hide: boolean) {

    let h: number = hide ? 1 : 0;
    let cmd: string = "update view_" + id + " set hide=" + h + " where emigo_id='" + emigoId + "' and subject_id='" + subjectId + "'";
    await this.database.execSQL(cmd);
  }

  public async setViewSubjectData(id: string, emigoId: string, subjectId: string, obj: any) {

    let cmd: string = "update view_" + id + " set app_subject=" + this.encodeObject(obj) + " where emigo_id='" + emigoId + "' and subject_id='" + subjectId + "'";
    await this.database.execSQL(cmd);
  }

  public async setViewSubjectSearchable(id: string, emigoId: string, subjectId: string, str: string) {

    let s: string;
    if(str == null) {
      s = "null";
    }
    else {
      s = "'" + str.replace(/["',]/g, " ") + "'";
    } 

    let cmd: string = "update view_" + id + " set searchable=" + s + " where emigo_id='" + emigoId + "' and subject_id='" + subjectId + "'";
  }


  // aggregate entities

  public async getContacts(id: string, label: string, search: string, status: string, hidden: boolean): Promise<EmigoContact[]> {

    let s: string;
    if(search == null) {
      s = null;
    }
    else {
      s = "'%" + search.replace(/["'%,]/g, "") + "%'";
    }

    let c: string;
    if(status == null) {
      c = null;
    }
    else {
      c = "'" + status.replace(/["'%,]/g, "") + "'";
    }

    let h: string = "";
    if(hidden != null) {
      if(hidden) {
        h = " and hide = 1"; 
      }
      else {
        h = " and hide = 0"; 
      }
    }

    let cmd: string;

    if(c == null && label == null && s == null && hidden == null) {
      cmd = "select emigo_" + id + ".emigo_id, name, handle, node, registry, emigo_" + id + ".identity_revision, attribute_revision, app_identity, app_attribute, status, hide, share_id, share_" + id + ".revision, app_share, share_" + id + ".updated from emigo_" + id + " left outer join share_" + id + " on share_" + id + ".emigo_id = emigo_" + id + ".emigo_id order by name asc"
    }
    if(c == null && label == null && s == null && hidden != null) {
      cmd = "select emigo_" + id + ".emigo_id, name, handle, node, registry, emigo_" + id + ".identity_revision, attribute_revision, app_identity, app_attribute, status, hide, share_id, share_" + id + ".revision, app_share, share_" + id + ".updated from emigo_" + id + " left outer join share_" + id + " on share_" + id + ".emigo_id = emigo_" + id + ".emigo_id" + " where hide = " + (hidden ? "1" : "0") + " order by name asc"
    }
    if(c == null && label != null && label != "" && s != null) {
      cmd = "select emigo_" + id + ".emigo_id, name, handle, node, registry, emigo_" + id + ".identity_revision, attribute_revision, app_identity, app_attribute, status, hide, share_id, share_" + id + ".revision, app_share, share_" + id + ".updated from emigo_" + id + " inner join emigolabel_" + id + " on emigo_" + id + ".emigo_id = emigolabel_" + id + ".emigo_id left outer join share_" + id + " on share_" + id + ".emigo_id = emigo_" + id + ".emigo_id where label_id='" + label + "' and searchable like " + s + h + " group by emigo_" + id + ".emigo_id order by name asc"
    }
    if(c == null && label != null && label == "" && s != null) {
      cmd = "select emigo_" + id + ".emigo_id, name, handle, node, registry, emigo_" + id + ".identity_revision, attribute_revision, app_identity, app_attribute, status, hide, share_id, share_" + id + ".revision, app_share, share_" + id + ".updated from emigo_" + id + " left outer join emigolabel_" + id + " on emigo_" + id + ".emigo_id = emigolabel_" + id + ".emigo_id left outer join share_" + id + " on share_" + id + ".emigo_id = emigo_" + id + ".emigo_id where label_id is null and searchable like " + s + h + " group by emigo_" + id + ".emigo_id order by name asc"
    }
    if(c == null && label == null && s != null) {
      cmd = "select emigo_" + id + ".emigo_id, name, handle, node, registry, emigo_" + id + ".identity_revision, attribute_revision, app_identity, app_attribute, status, hide, share_id, share_" + id + ".revision, app_share, share_" + id + ".updated from emigo_" + id + " left outer join share_" + id + " on share_" + id + ".emigo_id = emigo_" + id + ".emigo_id where searchable like " + s + h + " order by name asc"
    }
    if(c == null && label != null && label != "" && s == null) {
      cmd = "select emigo_" + id + ".emigo_id, name, handle, node, registry, emigo_" + id + ".identity_revision, attribute_revision, app_identity, app_attribute, status, hide, share_id, share_" + id + ".revision, app_share, share_" + id + ".updated from emigo_" + id + " inner join emigolabel_" + id + " on emigo_" + id + ".emigo_id = emigolabel_" + id + ".emigo_id left outer join share_" + id + " on share_" + id + ".emigo_id = emigo_" + id + ".emigo_id where label_id='" + label + h + "' group by emigo_" + id + ".emigo_id order by name asc"
    }
    if(c == null && label != null && label == "" && s == null) {
      cmd = "select emigo_" + id + ".emigo_id, name, handle, node, registry, emigo_" + id + ".identity_revision, attribute_revision, app_identity, app_attribute, status, hide, share_id, share_" + id + ".revision, app_share, share_" + id + ".updated from emigo_" + id + " left outer join emigolabel_" + id + " on emigo_" + id + ".emigo_id = emigolabel_" + id + ".emigo_id left outer join share_" + id + " on share_" + id + ".emigo_id = emigo_" + id + ".emigo_id where label_id is null" + h + " group by emigo_" + id + ".emigo_id order by name asc"
    }

    if(c != null && label == null && s == null) {
      cmd = "select emigo_" + id + ".emigo_id, name, handle, node, registry, emigo_" + id + ".identity_revision, attribute_revision, app_identity, app_attribute, status, hide, share_id, share_" + id + ".revision, app_share, share_" + id + ".updated from emigo_" + id + " left outer join share_" + id + " on share_" + id + ".emigo_id = emigo_" + id + ".emigo_id where status=" + c + h + " order by name asc"
    }
    if(c != null && label != null && label != "" && s != null) {
      cmd = "select emigo_" + id + ".emigo_id, name, handle, node, registry, emigo_" + id + ".identity_revision, attribute_revision, app_identity, app_attribute, status, hide, share_id, share_" + id + ".revision, app_share, share_" + id + ".updated from emigo_" + id + " inner join emigolabel_" + id + " on emigo_" + id + ".emigo_id = emigolabel_" + id + ".emigo_id left outer join share_" + id + " on share_" + id + ".emigo_id = emigo_" + id + ".emigo_id where label_id='" + label + "' and status=" + c + " and searchable like " + s + h + " group by emigo_" + id + ".emigo_id order by name asc"
    }
    if(c != null && label != null && label == "" && s != null) {
      cmd = "select emigo_" + id + ".emigo_id, name, handle, node, registry, emigo_" + id + ".identity_revision, attribute_revision, app_identity, app_attribute, status, hide, share_id, share_" + id + ".revision, app_share, share_" + id + ".updated from emigo_" + id + " left outer join emigolabel_" + id + " on emigo_" + id + ".emigo_id = emigolabel_" + id + ".emigo_id left outer join share_" + id + " on share_" + id + ".emigo_id = emigo_" + id + ".emigo_id where label_id is null and and status=" + c + " and searchable like " + s + h + " group by emigo_" + id + ".emigo_id order by name asc"
    }
    if(c != null && label == null && s != null) {
      cmd = "select emigo_" + id + ".emigo_id, name, handle, node, registry, emigo_" + id + ".identity_revision, attribute_revision, app_identity, app_attribute, status, hide, share_id, share_" + id + ".revision, app_share, share_" + id + ".updated from emigo_" + id + " left outer join share_" + id + " on share_" + id + ".emigo_id = emigo_" + id + ".emigo_id where status=" + c + " and searchable like " + s + h + " order by name asc"
    }
    if(c != null && label != null && label != "" && s == null) {
      cmd = "select emigo_" + id + ".emigo_id, name, handle, node, registry, emigo_" + id + ".identity_revision, attribute_revision, app_identity, app_attribute, status, hide, share_id, share_" + id + ".revision, app_share, share_" + id + ".updated from emigo_" + id + " inner join emigolabel_" + id + " on emigo_" + id + ".emigo_id = emigolabel_" + id + ".emigo_id left outer join share_" + id + " on share_" + id + ".emigo_id = emigo_" + id + ".emigo_id where status=" + c + " and label_id='" + label + h + "' group by emigo_" + id + ".emigo_id order by name asc"
    }
    if(c != null && label != null && label == "" && s == null) {
      cmd = "select emigo_" + id + ".emigo_id, name, handle, node, registry, emigo_" + id + ".identity_revision, attribute_revision, app_identity, app_attribute, status, hide, share_id, share_" + id + ".revision, app_share, share_" + id + ".updated from emigo_" + id + " left outer join emigolabel_" + id + " on emigo_" + id + ".emigo_id = emigolabel_" + id + ".emigo_id left outer join share_" + id + " on share_" + id + ".emigo_id = emigo_" + id + ".emigo_id where status=" + c + h + " and label_id is null group by emigo_" + id + ".emigo_id order by name asc"
    }

    let rows = await this.database.all(cmd);
    let contacts: EmigoContact[] = [];
    for(let i = 0; i < rows.length; i++) {
      contacts.push({
        emigoId: rows[i][0],
        name: rows[i][1],
        handle: rows[i][2],
        node: rows[i][3],
        registry: rows[i][4],
        identityRevision: rows[i][5],
        attributeRevision: rows[i][6],
        identityData: this.decodeObject(rows[i][7]),
        attributeData: this.decodeObject(rows[i][8]),
        status: rows[i][9],
        hidden: rows[i][10] == 1 ? true : false,
        shareId: rows[i][11],
        shareRevision: rows[i][12],
        shareData: this.decodeObject(rows[i][13]),
        updated: rows[i][14],
      });
    }

    return contacts;
  }

  public async getContact(id: string, emigoId: string): Promise<EmigoContact> {

    let cmd: string = "select emigo_" + id + ".emigo_id, name, handle, node, registry, emigo_" + id + ".identity_revision, attribute_revision, app_identity, app_attribute, status, hide, share_id, share_" + id + ".revision, app_share, share_" + id + ".updated from emigo_" + id + " left outer join share_" + id + " on share_" + id + ".emigo_id = emigo_" + id + ".emigo_id where emigo_" + id + ".emigo_id='" + emigoId + "'";
 
    let rows = await this.database.all(cmd);
    let contact: EmigoContact = null;
    for(let i = 0; i < rows.length; i++) {
      contact = {
        emigoId: rows[i][0],
        name: rows[i][1],
        handle: rows[i][2],
        node: rows[i][3],
        registry: rows[i][4],
        identityRevision: rows[i][5],
        attributeRevision: rows[i][6],
        identityData: this.decodeObject(rows[i][7]),
        attributeData: this.decodeObject(rows[i][8]),
        status: rows[i][9],
        hidden: rows[i][10] == 1 ? true : false,
        shareId: rows[i][11],
        shareRevision: rows[i][12],
        shareData: this.decodeObject(rows[i][13]),
        updated: rows[i][14],
      };
    }

    return contact;
  }

  public async getSubjectFeed(id: string, label: string, search: string, limit: number): Promise<FeedSubjectEntry[]> {

    let s: string;
    if(search == null) {
      s = null;
    }
    else {
      s = "'%" + search.replace(/["'%,]/g, "") + "%'";
    }

    let l: string = "";
    if(limit != null) {
      l = " limit " + limit;
    }

    let cmd: string;
    if(label == null && s == null) {
      cmd = "select subject_id, created, modified, expires, schema, data, revision, app_subject, assets, originals, ready, share, tag_count from show_" + id + " order by modified desc" + l;
    }
    if(label == null && s != null) {
      cmd = "select subject_id, created, modified, expires, schema, data, revision, app_subject, assets, originals, ready, share, tag_count from show_" + id + " where show_" + id + ".searchable like " + s + " order by modified desc" + l;
    }
    if(label != null && label == '' && s == null) {
      cmd = "select show_" + id + ".subject_id, created, modified, expires, schema, data, revision, app_subject, assets, originals, ready, share, tag_count from show_" + id + " left outer join showlabel_" + id + " on show_" + id + ".subject_id = showlabel_" + id + ".subject_id where label_id is null order by modified desc" + l;
    }
    if(label != null && label != '' && s == null) {
      cmd = "select show_" + id + ".subject_id, created, modified, expires, schema, data, revision, app_subject, assets, originals, ready, share, tag_count from show_" + id + " left outer join showlabel_" + id + " on show_" + id + ".subject_id = showlabel_" + id + ".subject_id where label_id='" + label + "' order by modified desc" + l;
    }
    if(label != null && label == '' && s != null) {
      cmd = "select show_" + id + ".subject_id, created, modified, expires, schema, data, revision, app_subject, assets, originals, ready, share, tag_count from show_" + id + " left outer join showlabel_" + id + " on show_" + id + ".subject_id = showlabel_" + id + ".subject_id where label_id is null and show_" + id + ".searchable like " + s + " order by modified desc" + l; 
    }
    if(label != null && label != '' && s != null) {
      cmd = "select show_" + id + ".subject_id, created, modified, expires, schema, data, revision, app_subject, assets, originals, ready, share, tag_count from show_" + id + " left outer join showlabel_" + id + " on show_" + id + ".subject_id = showlabel_" + id + ".subject_id where label_id='" + label + "' and show_" + id + ".searchable like " + s + " order by modified desc" + l; 
    }

    let rows = await this.database.all(cmd);
    let subjects: FeedSubjectEntry[] = [];
    for(let i = 0; i < rows.length; i++) {
      subjects.push({
        subjectId: rows[i][0],
        created: rows[i][1],
        modified: rows[i][2],
        expires: rows[i][3],
        schema: rows[i][4],
        data: this.decodeText(rows[i][5]),
        revision: rows[i][6],
        appData: this.decodeObject(rows[i][7]),
        assets: this.decodeObject(rows[i][8]),
        originals: this.decodeObject(rows[i][9]),
        ready: rows[i][10] >= 1 ? true : false,
        share: rows[i][11] >= 1 ? true : false,
        tagCount: rows[i][12]
      });
    }
    return subjects;
  }

  public async getFeedSubjectEntry(id: string, subjectId: string): Promise<FeedSubjectEntry> {

    let cmd: string = "select subject_id, created, modified, expires, schema, data, revision, app_subject, assets, originals, ready, share, tag_count from show_" + id + " where subject_id='" + subjectId + "'";
    let rows = await this.database.all(cmd);
    let subject: FeedSubjectEntry = null;
    for(let i = 0; i < rows.length; i++) {
      subject = {
        subjectId: rows[i][0],
        created: rows[i][1],
        modified: rows[i][2],
        expires: rows[i][3],
        schema: rows[i][4],
        data: this.decodeText(rows[i][5]),
        revision: rows[i][6],
        appData: this.decodeObject(rows[i][7]),
        assets: this.decodeObject(rows[i][8]),
        originals: this.decodeObject(rows[i][9]),
        ready: rows[i][10] >= 1 ? true : false,
        share: rows[i][11] >= 1 ? true : false,
        tagCount: rows[i][12]
      };
    }
    return subject;
  }


  public async getHiddenFeed(id: string, label: string, search: string, limit: number): Promise<FeedSubject[]> {

    let s: string;
    if(search == null) {
      s = null;
    }
    else {
      s = "'%" + search.replace(/["'%,]/g, "") + "%'";
    }

    let l: string;
    if(limit == null) {
      l = "";
    }
    else {
      l = " limit " + limit;
    }

    let cmd: string;
    if(label == null && s == null) {
      cmd = "select emigo_" + id + ".emigo_id, name, handle, registry, node, token, view_" + id + ".subject_id, view_" + id + ".revision, created, modified, expires, schema, data, emigo_" + id + ".identity_revision, app_identity, view_" + id + ".app_subject, tag_count from view_" + id + " inner join emigo_" + id + " on view_" + id + ".emigo_id = emigo_" + id + ".emigo_id left outer join share_" + id + " on share_" + id + ".emigo_id = emigo_" + id + ".emigo_id where view_" + id + ".hide=1 order by modified" + l;
    }
    if(label == null && s != null) {
      cmd = "select emigo_" + id + ".emigo_id, name, handle, registry, node, token, view_" + id + ".subject_id, view_" + id + ".revision, created, modified, expires, schema, data, emigo_" + id + ".identity_revision, app_identity, view_" + id + ".app_subject, tag_count from view_" + id + " inner join emigo_" + id + " on view_" + id + ".emigo_id = emigo_" + id + ".emigo_id left outer join share_" + id + " on share_" + id + ".emigo_id = emigo_" + id + ".emigo_id where view_" + id + ".searchable like " + s + " and view_" + id + ".hide=1 order by modified" + l;
    }
    if(label != null && s == null) {
      cmd = "select emigo_" + id + ".emigo_id, name, handle, registry, node, token, view_" + id + ".subject_id, view_" + id + ".revision, created, modified, expires, schema, data, emigo_" + id + ".identity_revision, app_identity, view_" + id + ".app_subject, tag_count from view_" + id + " inner join emigo_" + id + " on view_" + id + ".emigo_id = emigo_" + id + ".emigo_id left outer join emigolabel_" + id + " on emigo_" + id + ".emigo_id = emigolabel_" + id + ".emigo_id left outer join share_" + id + " on share_" + id + ".emigo_id = emigo_" + id + ".emigo_id where label_id='" + label + "' and view_" + id + ".hide=1 order by modified" + l;
    }
    if(label != null && s != null) {
      cmd = "select emigo_" + id + ".emigo_id, name, handle, registry, node, token, view_" + id + ".subject_id, view_" + id + ".revision, created, modified, expires, schema, data, emigo_" + id + ".identity_revision, app_identity, view_" + id + ".app_subject, tag_count from view_" + id + " inner join emigo_" + id + " on view_" + id + ".emigo_id = emigo_" + id + ".emigo_id left outer join emigolabel_" + id + " on emigo_" + id + ".emigo_id = emigolabel_" + id + ".emigo_id left outer join share_" + id + " on share_" + id + ".emigo_id = emigo_" + id + ".emigo_id where label_id='" + label + "' and view_" + id + ".searchable like " + s + " and view_" + id + ".hide=1 order by modified" + l;
    }

    let rows = await this.database.all(cmd);
    let subjects: FeedSubject[] = [];
    for(let i = 0; i < rows.length; i++) {
      subjects.push({
        emigoId: rows[i][0],
        name: rows[i][1],
        handle: rows[i][2],
        registry: rows[i][3],
        node: rows[i][4],
        token: rows[i][5],
        subjectId: rows[i][6],
        subjectRevision: rows[i][7],
        created: rows[i][8],
        modified: rows[i][9],
        expires: rows[i][10],
        schema: rows[i][11],
        data: this.decodeText(rows[i][12]),
        identityRevision: rows[i][13],
        identityData: this.decodeObject(rows[i][14]),
        subjectData: this.decodeObject(rows[i][15]),
        tagCount: rows[i][16]
      });
    }
    return subjects;
  }

  public async getEmigoFeed(id: string, emigo: string, label: string, search: string, limit: number): Promise<FeedSubject[]> {

    let s: string;
    if(search == null) {
      s = null;
    }
    else {
      s = "'%" + search.replace(/["'%,]/g, "") + "%'";
    }

    let l: string = "";
    if(limit != null) {
      l = " limit " + limit;
    }

    let cmd: string;
    if(emigo == null && label == null && s == null) {
      cmd = "select emigo_" + id + ".emigo_id, name, handle, registry, node, share_" + id + ".token, view_" + id + ".subject_id, view_" + id + ".revision, created, modified, expires, schema, data, emigo_" + id + ".identity_revision, app_identity, view_" + id + ".app_subject, tag_count from view_" + id + " inner join emigo_" + id + " on view_" + id + ".emigo_id = emigo_" + id + ".emigo_id left outer join share_" + id + " on share_" + id + ".emigo_id = emigo_" + id + ".emigo_id where view_" + id + ".hide=0 and emigo_" + id + ".hide=0 order by modified desc" + l;
    }
    if(emigo == null && label == null && s != null) {
      cmd = "select emigo_" + id + ".emigo_id, name, handle, registry, node, share_" + id + ".token, view_" + id + ".subject_id, view_" + id + ".revision, created, modified, expires, schema, data, emigo_" + id + ".identity_revision, app_identity, view_" + id + ".app_subject, tag_count from view_" + id + " inner join emigo_" + id + " on view_" + id + ".emigo_id = emigo_" + id + ".emigo_id left outer join share_" + id + " on share_" + id + ".emigo_id = emigo_" + id + ".emigo_id where view_" + id + ".searchable like " + s + " and view_" + id + ".hide=0 and emigo_" + id + ".hide=0 order by modified desc" + l;
    }
    if(emigo == null && label != null && s == null) {
      cmd = "select emigo_" + id + ".emigo_id, name, handle, registry, node, share_" + id + ".token, view_" + id + ".subject_id, view_" + id + ".revision, created, modified, expires, schema, data, emigo_" + id + ".identity_revision, app_identity, view_" + id + ".app_subject, tag_count from view_" + id + " inner join emigo_" + id + " on view_" + id + ".emigo_id = emigo_" + id + ".emigo_id left outer join emigolabel_" + id + " on emigo_" + id + ".emigo_id = emigolabel_" + id + ".emigo_id left outer join share_" + id + " on share_" + id + ".emigo_id = emigo_" + id + ".emigo_id where label_id='" + label + "' and view_" + id + ".hide=0 and emigo_" + id + ".hide=0 order by modified desc" + l;
    }
    if(emigo == null && label != null && s != null) {
      cmd = "select emigo_" + id + ".emigo_id, name, handle, registry, node, share_" + id + ".token, view_" + id + ".subject_id, view_" + id + ".revision, created, modified, expires, schema, data, emigo_" + id + ".identity_revision, app_identity, view_" + id + ".app_subject, tag_count from view_" + id + " inner join emigo_" + id + " on view_" + id + ".emigo_id = emigo_" + id + ".emigo_id left outer join emigolabel_" + id + " on emigo_" + id + ".emigo_id = emigolabel_" + id + ".emigo_id left outer join share_" + id + " on share_" + id + ".emigo_id = emigo_" + id + ".emigo_id where label_id='" + label + "' and view_" + id + ".searchable like " + s + " and view_" + id + ".hide=0 and emigo_" + id + ".hide=0 order by modified desc" + l;
    }
    if(emigo != null && label == null && s == null) {
      cmd = "select emigo_" + id + ".emigo_id, name, handle, registry, node, share_" + id + ".token, view_" + id + ".subject_id, view_" + id + ".revision, created, modified, expires, schema, data, emigo_" + id + ".identity_revision, app_identity, view_" + id + ".app_subject, tag_count from view_" + id + " inner join emigo_" + id + " on view_" + id + ".emigo_id = emigo_" + id + ".emigo_id left outer join share_" + id + " on share_" + id + ".emigo_id = emigo_" + id + ".emigo_id where emigo_" + id + ".emigo_id='" + emigo + "' and view_" + id + ".hide=0 and emigo_" + id + ".hide=0 order by modified desc" + l;
    }
    if(emigo != null && label == null && s != null) {
      cmd = "select emigo_" + id + ".emigo_id, name, handle, registry, node, share_" + id + ".token, view_" + id + ".subject_id, view_" + id + ".revision, created, modified, expires, schema, data, emigo_" + id + ".identity_revision, app_identity, view_" + id + ".app_subject, tag_count from view_" + id + " inner join emigo_" + id + " on view_" + id + ".emigo_id = emigo_" + id + ".emigo_id left outer join share_" + id + " on share_" + id + ".emigo_id = emigo_" + id + ".emigo_id where emigo_" + id + ".emigo_id='" + emigo + "' and view_" + id + ".searchable like " + s + " and view_" + id + ".hide=0 emigo_" + id + ".hide=0 order by modified desc" + l;
    }
    if(emigo != null && label != null && search == null) {
      cmd = "select emigo_" + id + ".emigo_id, name, handle, registry, node, share_" + id + ".token, view_" + id + ".subject_id, view_" + id + ".revision, created, modified, expires, schema, data, emigo_" + id + ".identity_revision, app_identity, view_" + id + ".app_subject, tag_count from view_" + id + " inner join emigo_" + id + " on view_" + id + ".emigo_id = emigo_" + id + ".emigo_id left outer join emigolabel_" + id + " on emigo_" + id + ".emigo_id = emigolabel_" + id + ".emigo_id left outer join share_" + id + " on share_" + id + ".emigo_id = emigo_" + id + ".emigo_id where label_id='" + label + "' and emigo_" + id + ".emigo_id = '" + emigo + "' and view_" + id + ".hide=0 and emigo_" + id + ".hide=0 order by modified desc" + l;
    }
    if(emigo != null && label != null && search != null) {
      cmd = "select emigo_" + id + ".emigo_id, name, handle, registry, node, share_" + id + ".token, view_" + id + ".subject_id, view_" + id + ".revision, created, modified, expires, schema, data, emigo_" + id + ".identity_revision, app_identity, view_" + id + ".app_subject, tag_count from view_" + id + " inner join emigo_" + id + " on view_" + id + ".emigo_id = emigo_" + id + ".emigo_id left outer join emigolabel_" + id + " on emigo_" + id + ".emigo_id = emigolabel_" + id + ".emigo_id left outer join share_" + id + " on share_" + id + ".emigo_id = emigo_" + id + ".emigo_id where label_id='" + label + "' and emigo_" + id + ".emigo_id = '" + emigo + "' and view_" + id + ".searchable like " + s + " and view_" + id + ".hide=0 and emigo_" + id + ".hide=0 order by modified desc" + l;
    }

    let rows = await this.database.all(cmd);
    let subjects: FeedSubject[] = [];
    for(let i = 0; i < rows.length; i++) {
      subjects.push({
        emigoId: rows[i][0],
        name: rows[i][1],
        handle: rows[i][2],
        registry: rows[i][3],
        node: rows[i][4],
        token: rows[i][5],
        subjectId: rows[i][6],
        subjectRevision: rows[i][7],
        created: rows[i][8],
        modified: rows[i][9],
        expires: rows[i][10],
        schema: rows[i][11],
        data: this.decodeText(rows[i][12]),
        identityRevision: rows[i][13],
        identityData: this.decodeObject(rows[i][14]),
        subjectData: this.decodeObject(rows[i][15]),
        tagCount: rows[i][16]
      });
    }
    return subjects;
  }

}







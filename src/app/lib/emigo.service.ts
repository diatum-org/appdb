import { Injectable, Type, Component } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse, HttpEvent } from '@angular/common/http';
import { HttpUrlEncodingCodec } from '@angular/common/http';
import { ImageSource, fromBase64 } from "tns-core-modules/image-source";

import { getEmigoObject } from './emigo.util';

import { Emigo } from './emigo';
import { EmigoMessage } from './emigoMessage';
import { ServiceAccess } from './serviceAccess';
import { LabelEntry } from './labelEntry';
import { EmigoEntry } from './emigoEntry';
import { EmigoView } from './emigoView';
import { Attribute } from './attribute';
import { AttributeEntry } from './attributeEntry';
import { AttributeView } from './attributeView';
import { Subject } from './subject';
import { SubjectEntry } from './subjectEntry';
import { SubjectView } from './subjectView';
import { PendingEmigo } from './pendingEmigo';
import { PendingEmigoView } from './pendingEmigoView';
import { ShareEntry } from './shareEntry';
import { ShareStatus } from './shareStatus';
import { ShareMessage } from './shareMessage';
import { ShareView } from './shareView';
import { LabelView } from './labelView';
import { SubjectTag } from './subjectTag';
import { Tag } from './tag';

import { FeedSubject } from './feedSubject';
import { FeedSubjectEntry } from './feedSubjectEntry';
import { EmigoContact } from './emigoContact';
import { PendingContact } from './pendingContact';

import { StoreService, IdRevision, EmigoUpdate } from './store.service';
import { RegistryService } from './registry.service';
import { AccessService } from './access.service';
import { IdentityService } from './identity.service';
import { GroupService } from './group.service';
import { ProfileService } from './profile.service';
import { IndexService } from './index.service';
import { ShareService } from './share.service';
import { ContactService } from './contact.service';
import { TokenService } from './token.service';
import { ShowService } from './show.service';
import { ViewService } from './view.service';

class Prop {
    public static readonly IDENTITY = "identity";
    public static readonly REVISION = "revision";
}

class Revision {
  identity: number;
  group: number;
  index: number;
  profile: number;
  show: number;
  share: number;
}

export class EmigoSubjectId {
  emigoId: string;  
  subjectId: string
}

class MapEntry{
  id: string;
  value: any;
}

@Injectable()
export class EmigoService {

  private emigoId: string; // active account
  private registry: string;
  private node: string;
  private token: string;
  private serviceNode: string;
  private serviceToken: string;
  private attributeFilter: string[];
  private subjectFilter: string[];
  private tagFilter: string;
  private stale: number;
  private revision: Revision;
  private access: ServiceAccess;
  private emigo: string;
  private emigoLabel: string;
  private emigoSearch: string;
  private showLabel: string;
  private showSearch: string;
  private viewLabel: string;
  private viewSearch: string;
  private syncInterval: any;
  private searchableSubject: any;
  private searchableEmigo: any;

  private selectedEmigo: BehaviorSubject<EmigoContact>;
  private attributeEntries: BehaviorSubject<AttributeEntry[]>;
  private labelEntries: BehaviorSubject<LabelEntry[]>;
  private filteredEmigos: BehaviorSubject<EmigoContact[]>;
  private connectedEmigos: BehaviorSubject<EmigoContact[]>;
  private requestedEmigos: BehaviorSubject<EmigoContact[]>;
  private receivedEmigos: BehaviorSubject<EmigoContact[]>;
  private savedEmigos: BehaviorSubject<EmigoContact[]>;
  private allEmigos: BehaviorSubject<EmigoContact[]>;
  private hiddenEmigos: BehaviorSubject<EmigoContact[]>;
  private pendingEmigos: BehaviorSubject<PendingContact[]>;
  private identityEmigo: BehaviorSubject<Emigo>;
  private showSubjects: BehaviorSubject<FeedSubjectEntry[]>;
  private viewSubjects: BehaviorSubject<FeedSubject[]>;

  constructor(private registryService: RegistryService,
      private accessService: AccessService,
      private identityService: IdentityService,
      private groupService: GroupService,
      private profileService: ProfileService,
      private indexService: IndexService,
      private shareService: ShareService,
      private contactService: ContactService,
      private tokenService: TokenService,
      private showService: ShowService,
      private viewService: ViewService,
      private storeService: StoreService) {

    this.selectedEmigo = new BehaviorSubject<EmigoContact>(null);
    this.attributeEntries = new BehaviorSubject<AttributeEntry[]>([]);
    this.labelEntries = new BehaviorSubject<LabelEntry[]>([]);
    this.filteredEmigos = new BehaviorSubject<EmigoContact[]>([]);
    this.connectedEmigos = new BehaviorSubject<EmigoContact[]>([]);
    this.requestedEmigos = new BehaviorSubject<EmigoContact[]>([]);
    this.receivedEmigos = new BehaviorSubject<EmigoContact[]>([]);
    this.savedEmigos = new BehaviorSubject<EmigoContact[]>([]);
    this.allEmigos = new BehaviorSubject<EmigoContact[]>([]);
    this.hiddenEmigos = new BehaviorSubject<EmigoContact[]>([]);
    this.pendingEmigos = new BehaviorSubject<PendingContact[]>([]);
    this.showSubjects = new BehaviorSubject<FeedSubjectEntry[]>([]);
    this.viewSubjects = new BehaviorSubject<FeedSubject[]>([]);
    this.identityEmigo = new BehaviorSubject<Emigo>(null);
    this.syncInterval = null;
  }

  get identity() {
    return this.identityEmigo.asObservable();
  }

  get labels() {
    return this.labelEntries.asObservable();
  }

  get attributes() {
    return this.attributeEntries.asObservable();
  }

  get selectedContact() {
    return this.selectedEmigo.asObservable();
  }

  get filteredContacts() {
    return this.filteredEmigos.asObservable();
  }

  get connectedContacts() {
    return this.connectedEmigos.asObservable();
  }

  get requestedContacts() {
    return this.requestedEmigos.asObservable();
  }

  get receivedContacts() {
    return this.receivedEmigos.asObservable();
  }

  get savedContacts() {
    return this.savedEmigos.asObservable();
  }

  get allContacts() {
    return this.allEmigos.asObservable();
  }

  get hiddenContacts() {
    return this.hiddenEmigos.asObservable();
  }

  get pendingContacts() {
    return this.pendingEmigos.asObservable();
  }

  get showFeed() {
    return this.showSubjects.asObservable();
  }

  get viewFeed() {
    return this.viewSubjects.asObservable();
  }

  public init(db: string): Promise<any> {
    return this.storeService.init(db);
  }

  public setAppContext(obj: any): Promise<void> {
    return this.storeService.setAppContext(obj);
  }

  public clearAppContext(): Promise<void> {
    return this.storeService.clearAppContext();
  }

  public setAppProperty(key: string, obj: any): Promise<void> {
    return this.storeService.setAppProperty(this.emigoId, "app_" + key, obj);
  }

  public getAppProperty(key: string): Promise<any> {
    return this.storeService.getAppProperty(this.emigoId, "app_" + key);
  }

  public clearAppProperty(key: string, obj: any): Promise<void> {
    return this.storeService.clearAppProperty(this.emigoId, "app_" + key);
  }

  // set account, validate token, return permissions, and periodically synchronize
  public async setEmigo(emigoId: string, registry: string, token: string, serviceNode: string, serviceToken: string, 
      attributeFilter: string[], subjectFilter: string[], tagFilter: string,
      searchableEmigo: any, searchableSubject: any,
      stale: number = 86400, refresh: number = 60) {

    // clear any perviously set account
    this.clearEmigo();
    
    // set new account
    this.emigoId = emigoId;
    this.token = token;
    this.registry = registry;
    this.serviceNode = serviceNode;
    this.serviceToken = serviceToken;
    this.attributeFilter = attributeFilter;
    this.subjectFilter = subjectFilter;
    this.tagFilter = tagFilter;
    this.searchableEmigo = searchableEmigo;
    this.searchableSubject = searchableSubject;
    this.stale = stale;

    // init sync revision for each module
    this.revision = { identity: 0, group: 0, index: 0, profile: 0, show: 0, share: 0 };

    // import account if access and identity have not already been stored
    let access: ServiceAccess = await this.storeService.setAccount(emigoId);
    let emigo: Emigo = await this.storeService.getAppProperty(this.emigoId, Prop.IDENTITY);
    if(access == null || emigo == null) {

      // retrieve identity
      let msg: EmigoMessage = await this.registryService.getMessage(registry, this.emigoId);
      emigo = getEmigoObject(msg);
      this.identityEmigo.next(emigo);
      this.node = emigo.node;
      this.registry = emigo.registry;
      await this.storeService.setAppProperty(this.emigoId, Prop.IDENTITY, emigo);
      this.revision.identity = emigo.revision;
      this.identityEmigo.next(emigo);

      // retrieve access
      this.access = await this.tokenService.getAccess(this.node, this.token);

      // import account but dont wait
      try {
        this.importAccount(registry);
      }
      catch(e) {
        console.error(e);
      }
    }
    else {

      // set module access
      this.access = access;      

      // retrieve identity
      this.identityEmigo.next(emigo);
      this.registry = emigo.registry;
      this.node = emigo.node;
      this.identityEmigo.next(emigo);

      // retrieve attributes
      let a: AttributeEntry[] = await this.storeService.getAttributes(this.emigoId);
      this.attributeEntries.next(a);

      // retrieve labels
      let l: LabelEntry[] = await this.storeService.getLabels(this.emigoId);
      this.labelEntries.next(l);

      // refresh contacts
      this.refreshEmigos();
      this.refreshContacts();
      this.refreshPending();
      this.refreshShowFeed();
      this.refreshViewFeed();

      // retrieve revision
      let r = await this.storeService.getAppProperty(this.emigoId, Prop.REVISION);
      if(r != null) {
        this.revision = r;
      }
    }

    // periodically sync appdb
    this.syncChanges();
    this.syncInterval = setInterval(() => { this.syncChanges(); }, refresh * 1000);

    return this.access; 
  }

  // clear account
  public clearEmigo(): void {

    if(this.syncInterval != null) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    this.viewService.clearAuth();
    this.contactService.clearAuth();

    this.emigoLabel = null;
    this.emigoSearch = null;
    this.showLabel = null;
    this.showSearch = null;
    this.viewLabel = null;
    this.viewSearch = null;
    this.emigoId = null;
    this.selectedEmigo.next(null);
    this.labelEntries.next([]);
    this.attributeEntries.next([]);
    this.filteredEmigos.next([]);
    this.connectedEmigos.next([]);
    this.receivedEmigos.next([]);
    this.requestedEmigos.next([]);
    this.savedEmigos.next([]);
    this.allEmigos.next([]);
    this.pendingEmigos.next([]);
    this.showSubjects.next([]);
    this.viewSubjects.next([]);
    this.identityEmigo.next(null);
  }

  private async importAccount(registry: string) {

    try {
      // sync each module
      await this.syncIdentity();
      await this.syncGroup();
      await this.syncShare();
      await this.syncIndex();
      await this.syncProfile();
      await this.syncShow();

      // retrieve each contact
      let d: Date = new Date();
      let cur: number = Math.floor(d.getDate() / 1000);
      let updates: EmigoUpdate[] = await this.storeService.getEmigoUpdates(this.emigoId);
      for(let i = 0; i < updates.length; i++) {

        // update identity
        await this.syncEmigoIdentity(updates[i]);

        // update attributes
        await this.syncEmigoAttributes(updates[i]);

        // update subjects
        await this.syncEmigoSubjects(updates[i]);

        // set updated timestamp
        await this.storeService.setEmigoUpdateTimestamp(this.emigoId, updates[i].emigoId, cur);
      }

      // store revision
      await this.storeService.setAppProperty(this.emigoId, Prop.REVISION, this.revision);

      // store access
      await this.storeService.setAppAccount(this.emigoId, this.access);
    }
    catch(e) {
      console.log("import failed");
      console.log(e);
    }
  }

  private async syncEmigoIdentity(update: EmigoUpdate) {

    // sync with index
    if(this.access.enableIndex == true) {

      // flag if contacts should refresh
      let refresh: boolean = false;

      try {
        let indexRevision: number = await this.indexService.getEmigoRevision(this.node, this.token, update.emigoId);
        if(indexRevision != update.identityRevision) {
          let emigo: Emigo = await this.indexService.getEmigoIdentity(this.node, this.token, update.emigoId);
          update.node = emigo.node;
          update.registry = emigo.registry;
          update.identityRevision = emigo.revision;
          await this.storeService.setEmigoIdentity(this.emigoId, update.emigoId, emigo, this.searchableEmigo);
          update.identityRevision = indexRevision;
          refresh = true;
        }

        // sync with registry
        if(update.registry != null) {
          let registryRevision: number = await this.registryService.getRevision(update.registry, update.emigoId);
          if(registryRevision != update.identityRevision) {
            let msg: EmigoMessage = await this.registryService.getMessage(update.registry, update.emigoId);
            let emigo: Emigo = await this.indexService.setEmigo(this.node, this.token, msg);
            update.node = emigo.node;
            update.registry = emigo.registry;
            update.identityRevision = emigo.revision;
            await this.storeService.setEmigoIdentity(this.emigoId, update.emigoId, emigo, this.searchableEmigo);
            update.identityRevision = registryRevision;
            refresh = true;
          }
        }

        // if contacts should refresh
        if(refresh) {
          await this.refreshEmigos();
          await this.refreshContacts();
        }
      }
      catch(e) {
        if(this.emigoId != null) {
          console.error(e);
        }
      }
    }
  }

  private async syncEmigoAttributes(update: EmigoUpdate) {

    // flag if contacts should refresh
    let refresh: boolean = false;
    
    try {
      if(update.shareStatus == "connected") {

        // sync with contact module
        let revision: number = await this.contactService.getRevision(this.serviceNode, this.serviceToken, update.node, update.token);
        if(revision != update.attributeRevision) {
          
          // get remote attributes
          let remote: AttributeView[] = await this.contactService.getAttributeViews(this.serviceNode, this.serviceToken, 
              update.node, update.token, this.attributeFilter);
          let remoteMap: Map<string, number> = new Map<string, number>();
          for(let i = 0; i < remote.length; i++) {
            remoteMap.set(remote[i].attributeId, remote[i].revision);
          }

          // get local attributes
          let local: AttributeView[] = await this.storeService.getEmigoAttributeViews(this.emigoId, update.emigoId);
          let localMap: Map<string, number> = new Map<string, number>();
          for(let i = 0; i < local.length; i++) {
            localMap.set(local[i].attributeId, local[i].revision);
          }

          // add remote entry not in local
          await this.asyncForEach(remoteMap, async (value, key) => {
            if(!localMap.has(key)) {
              let a: Attribute = await this.contactService.getAttribute(this.serviceNode, this.serviceToken,
                update.node, update.token, key);
              await this.storeService.addEmigoAttribute(this.emigoId, update.emigoId, a);
              refresh = true;
            }
            else if(localMap.get(key) != value) {
              let a: Attribute = await this.contactService.getAttribute(this.serviceNode, this.serviceToken,
                update.node, update.token, key);
              await this.storeService.updateEmigoAttribute(this.emigoId, update.emigoId, a);
              refresh = true;
            }
          });

          // remove any local entry not in remote
          await this.asyncForEach(localMap, async (value, key) => {
            if(!remoteMap.has(key)) {
              await this.storeService.removeEmigoAttribute(this.emigoId, update.emigoId, key);
              refresh = true;
            }
          });

          // set updated revision
          await this.storeService.setEmigoAttributeRevision(this.emigoId, update.emigoId, revision);
          update.attributeRevision = revision;
        }
      }
      else {

        // remove any attributes
        let local: AttributeView[] = await this.storeService.getEmigoAttributeViews(this.emigoId, update.emigoId);
        for(let i = 0; i < local.length; i++) {
          await this.storeService.removeEmigoAttribute(this.emigoId, update.emigoId, local[i].attributeId);
          refresh = true;
        }
        
        // clear revision
        if(update.attributeRevision != null) {  
          await this.storeService.setEmigoAttributeRevision(this.emigoId, update.emigoId, null);
        }
      }

      // refresh contacst
      if(refresh) {
        await this.refreshEmigos();
        await this.refreshContacts();
      }
    }
    catch(e) {
      if(this.emigoId != null) {
        console.error(e);
      }
    }
  }

  private async syncEmigoSubjects(update: EmigoUpdate) {

    // flag if contacts should refresh
    let refresh: boolean = false;

    try {
      if(update.shareStatus == "connected") {
        
        // sync with view module
        let revision: number = await this.viewService.getRevision(this.serviceNode, this.serviceToken, update.node, update.token);
        if(revision != update.subjectRevision) {

          // get remote subjects
          let remote: SubjectView[] = await this.viewService.getSubjectViews(this.serviceNode, this.serviceToken, 
              update.node, update.token, this.subjectFilter);
          let remoteMap: Map<string, any> = new Map<string, any>();
          for(let i = 0; i < remote.length; i++) {
            remoteMap.set(remote[i].subjectId, { subjet: remote[i].revision, tag: remote[i].tagRevision });
          }

          // get local subjects
          let local: SubjectView[] = await this.storeService.getEmigoSubjectViews(this.emigoId, update.emigoId);
          let localMap: Map<string, any> = new Map<string, any>();
          for(let i = 0; i < local.length; i++) {
            localMap.set(local[i].subjectId, { subject: local[i].revision, tag: local[i].tagRevision });
          }

          // add remote entry not in local
          await this.asyncForEach(remoteMap, async (value, key) => {
            if(!localMap.has(key)) {
              let subject: Subject = await this.viewService.getSubject(this.serviceNode, this.serviceToken, update.node, update.token, key);
              await this.storeService.addEmigoSubject(this.emigoId, update.emigoId, subject, this.searchableSubject);
              if(value.tag != null) {
                let tag: SubjectTag = await this.viewService.getSubjectTags(this.serviceNode, this.serviceToken, update.node, update.token, 
                    key, this.tagFilter);
                await this.storeService.updateEmigoSubjectTags(this.emigoId, update.emigoId, key, tag.revision, tag.tags);
              }
              refresh = true;
            }
            else {
              if(localMap.get(key).subject != value.subject) {
                let subject: Subject = await this.viewService.getSubject(this.serviceNode, this.serviceToken, update.node, update.token, key);
                await this.storeService.updateEmigoSubject(this.emigoId, update.emigoId, subject, this.searchableSubject);
                refresh = true;
              }

              if(localMap.get(key).tag != value.tag) {
                let tag: SubjectTag = await this.viewService.getSubjectTags(this.serviceNode, this.serviceToken, update.node, update.token, 
                    key, this.tagFilter);
                await this.storeService.updateEmigoSubjectTags(this.emigoId, update.emigoId, key, tag.revision, tag.tags);
                refresh = true;
              }
            }
          });

          // remove any local entry not in remote
          await this.asyncForEach(localMap, async (value, key) => {
            if(!remoteMap.has(key)) {
              await this.storeService.removeEmigoSubject(this.emigoId, update.emigoId, key);
              refresh = true;
            }
          });

          // set updated revision
          await this.storeService.setEmigoSubjectRevision(this.emigoId, update.emigoId, revision);
          update.subjectRevision = revision;
        }
      }
      else {

        // remove any subjects
        let local: SubjectView[] = await this.storeService.getEmigoSubjectViews(this.emigoId, update.emigoId);
        for(let i = 0; i < local.length; i++) {
          await this.storeService.removeEmigoSubject(this.emigoId, update.emigoId, local[i].subjectId);
          refresh = true;
        }

        // clear revision
        if(update.subjectRevision != null) {
          await this.storeService.setEmigoSubjectRevision(this.emigoId, update.emigoId, null);
        }
      }

      // refresh contacts
      if(refresh) {
        this.refreshViewFeed();
      }
    }
    catch(e) {
      if(this.emigoId != null) {
        console.error(e);
      } 
    }
  }

  private async syncShow() {

    if(this.access.enableShow == true) {
      try {
        let r = await this.showService.getRevision(this.node, this.token);
        if(this.revision.show != r) {
      
          // flag if feed should refresh
          let refresh: boolean = false;

          // get remote subject entries
          let remote: SubjectView[] = await this.showService.getSubjectViews(this.node, this.token, this.subjectFilter);
          let remoteMap: Map<string, any> = new Map<string, any>();
          for(let i = 0; i < remote.length; i++) {
            remoteMap.set(remote[i].subjectId, { subject: remote[i].revision, tag: remote[i].tagRevision });
          }

          // get local subject entries
          let local: SubjectView[] = await this.storeService.getSubjectViews(this.emigoId);
          let localMap: Map<string, any> = new Map<string, any>();
          for(let i = 0; i < local.length; i++) {
            localMap.set(local[i].subjectId, { subject: local[i].revision, tag: local[i].tagRevision });
          }

          // add remote entry not in local
          await this.asyncForEach(remoteMap, async (value, key) => {

            if(!localMap.has(key)) {
              let entry: SubjectEntry = await this.showService.getSubject(this.node, this.token, key);
              await this.storeService.addSubject(this.emigoId, entry, this.searchableSubject);
              await this.storeService.clearSubjectLabels(this.emigoId, key);
              for(let i = 0; i < entry.labels.length; i++) {
                await this.storeService.setSubjectLabel(this.emigoId, key, entry.labels[i]);
              }
              if(value.tag != 0) {
                let tag: SubjectTag = await this.showService.getSubjectTags(this.node, this.token, key, this.tagFilter);
                await this.storeService.updateSubjectTags(this.emigoId, key, tag.revision, tag.tags);
              }
              refresh = true;
            }
            else {
              if(localMap.get(key).subject != value.subject) {
                let entry: SubjectEntry = await this.showService.getSubject(this.node, this.token, key);
                await this.storeService.updateSubject(this.emigoId, entry, this.searchableSubject);
                await this.storeService.clearSubjectLabels(this.emigoId, key);
                for(let i = 0; i < entry.labels.length; i++) {
                  await this.storeService.setSubjectLabel(this.emigoId, key, entry.labels[i]);
                }
                refresh = true;
              }

              if(localMap.get(key).tag != value.tag) {
                let tag: SubjectTag = await this.showService.getSubjectTags(this.node, this.token, key, this.tagFilter);
                await this.storeService.updateSubjectTags(this.emigoId, key, tag.revision, tag.tags);
                refresh = true;
              }
            }
          });

          // remove any local entry not in remote
          await this.asyncForEach(localMap, async (value, key) => {
            if(!remoteMap.has(key)) {
              await this.storeService.removeSubject(this.emigoId, key);
              refresh = true;
            }
          });

          // refresh feed
          if(refresh) {
            await this.refreshShowFeed();
          }

          // upldate group revision
          this.revision.show = r;
          await this.storeService.setAppProperty(this.emigoId, Prop.REVISION, this.revision);
        }
      }
      catch(e) {
        if(this.emigoId != null) {
          console.error(e);
        }
      }
    }
  }
 
  private async syncProfile() {

    if(this.access.enableProfile == true) {
      try {
        let r = await this.profileService.getRevision(this.node, this.token);

        if(this.revision.profile != r) {

          // flag set if attributes should refresh
          let refresh: boolean = false;

          // get remote attribute entries
          let remote: AttributeView[] = await this.profileService.getAttributeViews(this.node, this.token, this.attributeFilter);
          let remoteMap: Map<string, number> = new Map<string, number>();
          for(let i = 0; i < remote.length; i++) {
            remoteMap.set(remote[i].attributeId, remote[i].revision);
          }

          // get local attribute entries
          let local: AttributeView[] = await this.storeService.getAttributeViews(this.emigoId);
          let localMap: Map<string, number> = new Map<string, number>();
          for(let i = 0; i < local.length; i++) {
            localMap.set(local[i].attributeId, local[i].revision);
          }

          await this.asyncForEach(remoteMap, async (value, key) => {

            if(!localMap.has(key)) {

              // add any remote entry not local
              let entry: AttributeEntry = await this.profileService.getAttribute(this.node, this.token, key);
              await this.storeService.addAttribute(this.emigoId, entry.attribute);
              await this.storeService.clearAttributeLabels(this.emigoId, entry.attribute.attributeId);
              for(let i = 0; i < entry.labels.length; i++) {
                await this.storeService.setAttributeLabel(this.emigoId, key, entry.labels[i]);
              }
              refresh = true;  
            }
            else if(localMap.get(key) != value) {

              // update any entry with different revision
              let entry: AttributeEntry = await this.profileService.getAttribute(this.node, this.token, key);
              await this.storeService.updateAttribute(this.emigoId, entry.attribute);
              await this.storeService.clearEmigoLabels(this.emigoId, entry.attribute.attributeId);
              for(let i = 0; i < entry.labels.length; i++) {
                await this.storeService.setAttributeLabel(this.emigoId, entry.attribute.attributeId, entry.labels[i]);
              }
              refresh = true
            }
          });

          // remove any local entry not in remote
          await this.asyncForEach(localMap, async (value, key) => {
            if(!remoteMap.has(key)) {
              await this.storeService.removeAttribute(this.emigoId, key);
              refresh = true;
            }
          });

          // upldate group revision
          this.revision.profile = r;
          await this.storeService.setAppProperty(this.emigoId, Prop.REVISION, this.revision);
          
          // push attributes to app
          if(refresh) {
            let entries: AttributeEntry[] = await this.storeService.getAttributes(this.emigoId);
            this.attributeEntries.next(entries);
          }
        }
      }
      catch(e) {
        if(this.emigoId != null) {
          console.error(e);
        }
      }
    }
  }
 
  private async syncIndex() {


    if(this.access.enableIndex == true) {
      try {

        let r = await this.indexService.getRevision(this.node, this.token);
        if(this.revision.index != r) {

          // flag if emigos should refresh
          let refresh: boolean = false;

          // get remote view
          let remote: EmigoView[] = await this.indexService.getEmigoViews(this.node, this.token);
          let remoteMap: Map<string, number> = new Map<string, number>();
          for(let i = 0; i < remote.length; i++) {
            remoteMap.set(remote[i].emigoId, remote[i].revision);
          }

          // get local view
          let local: EmigoView[] = await this.storeService.getEmigoViews(this.emigoId);
          let localMap: Map<string, number> = new Map<string, number>();
          for(let i = 0; i < local.length; i++) {
            localMap.set(local[i].emigoId, local[i].revision);
          }

          await this.asyncForEach(remoteMap, async (value, key) => {
          
            if(!localMap.has(key)) {
              
              // add any remote entry not local
              let emigo: EmigoEntry = await this.indexService.getEmigo(this.node, this.token, key);
              await this.storeService.addEmigo(this.emigoId, emigo.emigoId, emigo.notes, emigo.revision);
              await this.storeService.clearEmigoLabels(this.emigoId, emigo.emigoId);
              for(let i = 0; i < emigo.labels.length; i++) {
                await this.storeService.setEmigoLabel(this.emigoId, key, emigo.labels[i]);
              }
              refresh = true;  
            }
            else if(localMap.get(key) != value) {

              // update any entry with different revision
              let emigo: EmigoEntry = await this.indexService.getEmigo(this.node, this.token, key);
              await this.storeService.updateEmigo(this.emigoId, emigo.emigoId, emigo.notes, emigo.revision);
              await this.storeService.clearEmigoLabels(this.emigoId, emigo.emigoId);
              for(let i = 0; i < emigo.labels.length; i++) {
                await this.storeService.setEmigoLabel(this.emigoId, emigo.emigoId, emigo.labels[i]);
              }
              refresh = true
            }
          });

          // remove any local entry not in remote
          await this.asyncForEach(localMap, async (value, key) => {
            if(!remoteMap.has(key)) {
              await this.storeService.removeEmigo(this.emigoId, key);
              refresh = true;
            }
          });

          // retrieve remote list of pending shares
          let remoteReq: PendingEmigoView[] = await this.indexService.getPendingRequests(this.node, this.token);
          let remoteReqMap: Map<string, number> = new Map<string, number>();
          for(let i = 0; i < remoteReq.length; i++) {
            remoteReqMap.set(remoteReq[i].shareId, remoteReq[i].revision);
          }

          // retrieve local list of pending shares
          let localReq: PendingEmigoView[] = await this.storeService.getPendingViews(this.emigoId);
          let localReqMap: Map<string, number> = new Map<string, number>();
          for(let i = 0; i < localReq.length; i++) {
            localReqMap.set(localReq[i].shareId, localReq[i].revision);
          } 

          // flag if pending emigos should refresh
          let pending: boolean = false;

          // add any new pending requests
          await this.asyncForEach(remoteReqMap, async (value, key) => {

            if(!localReqMap.has(key)) {

              // add any remote entry not local
              let emigo: PendingEmigo = await this.indexService.getPendingRequest(this.node, this.token, key);
              await this.storeService.addPending(this.emigoId, emigo);
              pending = true;
            }
            else if(localReqMap.get(key) != value) {
  
              // add any entry with different revision
              let emigo: PendingEmigo = await this.indexService.getPendingRequest(this.node, this.token, key);
              await this.storeService.updatePending(this.emigoId, key, emigo);
              pending = true; 
            }
          });

          // remove old pending requests
          this.asyncForEach(localReqMap, async (value, key) => {
            if(!remoteReqMap.has(key)) {
              await this.storeService.removePending(this.emigoId, key);
              pending = true;
            }
          });

          // refresh contacts
          if(refresh) {
            await this.refreshEmigos();
            await this.refreshContacts();
          }

          // refresh pending list
          if(pending) {
            await this.refreshPending();
          }

          // upldate group revision
          this.revision.index = r;
          await this.storeService.setAppProperty(this.emigoId, Prop.REVISION, this.revision);
        }
      }
      catch(e) {
        if(this.emigoId != null) {
          console.log(e);
        }
      }
    }
  }
  
  private async syncShare() {

    if(this.access.enableShare == true) {
      try {
        let r = await this.shareService.getRevision(this.node, this.token);
        if(this.revision.share != r) {

          // if contact should refresh
          let refresh: boolean = false;
      
          // get remote share entries
          let remote: ShareView[] = await this.shareService.getConnectionViews(this.node, this.token);
          let remoteMap: Map<string, number> = new Map<string, number>();
          for(let i = 0; i < remote.length; i++) {
            remoteMap.set(remote[i].shareId, remote[i].revision);
          }

          // get local share entries
          let local: ShareView[] = await this.storeService.getConnectionViews(this.emigoId);
          let localMap: Map<string, number> = new Map<string, number>();
          for(let i = 0; i < local.length; i++) {
            localMap.set(local[i].shareId, local[i].revision);
          }

          // add remote entry not in local
          await this.asyncForEach(remoteMap, async (value, key) => {
            if(!localMap.has(key)) {
              let entry: ShareEntry = await this.shareService.getConnection(this.node, this.token, key);
              await this.storeService.addConnection(this.emigoId, entry);
              refresh = true;
            }
            else if(localMap.get(key) != value) {
              let entry: ShareEntry = await this.shareService.getConnection(this.node, this.token, key);
              await this.storeService.updateConnection(this.emigoId, entry);
              refresh = true;
            }
          });

          // remove any local entry not in remote
          await this.asyncForEach(localMap, async (value, key) => {
            if(!remoteMap.has(key)) {
              await this.storeService.removeConnection(this.emigoId, key);
              refresh = true;
            }
          });
    
          // upldate group revision
          this.revision.share = r;
          await this.storeService.setAppProperty(this.emigoId, Prop.REVISION, this.revision);

          // if contacts should refresh
          if(refresh) {
            this.refreshEmigos();
            this.refreshContacts();
          }
        }
      }
      catch(e) {
        if(this.emigoId != null) {
          console.log(e);
        }
      }
    }
  }
  
  private async syncGroup() {

    if(this.access.enableGroup == true) {
      try {
        let r = await this.groupService.getRevision(this.node, this.token);
        if(this.revision.group != r) {

          // flag if shoudl refresh
          let refresh: boolean = false;

          // get remote label entries
          let remote: LabelView[] = await this.groupService.getLabelViews(this.node, this.token);
          let remoteMap: Map<string, number> = new Map<string, number>();
          for(let i = 0; i < remote.length; i++) {
            remoteMap.set(remote[i].labelId, remote[i].revision);
          }

          // get local label entries
          let local: LabelView[] = await this.storeService.getLabelViews(this.emigoId);
          let localMap: Map<string, number> = new Map<string, number>();
          for(let i = 0; i < local.length; i++) {
            localMap.set(local[i].labelId, local[i].revision);
          }

          // add remote entry not in local
          await this.asyncForEach(remoteMap, async (value, key) => {
            if(!localMap.has(key)) {
              let entry = await this.groupService.getLabel(this.node, this.token, key);
              await this.storeService.addLabel(this.emigoId, entry);
              refresh = true;
            }
            else if(localMap.get(key) != value) {
              let entry = await this.groupService.getLabel(this.node, this.token, key);
              await this.storeService.updateLabel(this.emigoId, entry);
              refresh = true;
            }
          });

          // remove any local entry not in remote
          await this.asyncForEach(localMap, async (value, key) => {
            if(!remoteMap.has(key)) {
              await this.storeService.removeLabel(this.emigoId, key);
              refresh = true;
            }
          });
          
          // upldate group revision
          this.revision.group = r;
          await this.storeService.setAppProperty(this.emigoId, Prop.REVISION, this.revision);

          // push labels
          if(refresh) {
            let labels: LabelEntry[] = await this.storeService.getLabels(this.emigoId);
            this.labelEntries.next(labels);
          }
        }
      }
      catch(e) {
        if(this.emigoId != null) {
          console.error(e);
        }
      }
    }
  }

  private async syncIdentity() {

    if(this.access.enableIdentity == true) {

      try {
        let r = await this.identityService.getRevision(this.node, this.token);
        if(this.revision.identity != r) {  
          let emigo: Emigo = await this.identityService.getEmigo(this.node, this.token);
          this.identityEmigo.next(emigo);
          this.node = emigo.node;
          this.registry = emigo.registry;
          await this.storeService.setAppProperty(this.emigoId, Prop.IDENTITY, emigo);
          this.revision.identity = emigo.revision;
          await this.storeService.setAppProperty(this.emigoId, Prop.REVISION, this.revision);
        }
      }
      catch(e) {
        console.error(e);
      }

      try {
        if(this.registry != null) {
          let r = await this.registryService.getRevision(this.registry, this.emigoId);
          if(this.revision.identity < r) {
            let msg: EmigoMessage = await this.registryService.getMessage(this.node, this.token);
            let emigo: Emigo = getEmigoObject(msg);
            this.identityEmigo.next(emigo);
            this.node = emigo.node;
            this.registry = emigo.registry;
            await this.storeService.setAppProperty(this.emigoId, Prop.IDENTITY, emigo);
            this.revision.identity = emigo.revision;
            await this.storeService.setAppProperty(this.emigoId, Prop.REVISION, this.revision);
          }
          if(this.revision.identity > r) {
            let msg: EmigoMessage = await this.identityService.getMessage(this.node, this.token);
            let emigo: Emigo = getEmigoObject(msg);
            await this.registryService.setMessage(emigo.registry, msg);
            await this.identityService.clearDirty(this.node, this.token, emigo.revision);
          }
        }
      }
      catch(e) {
        if(this.emigoId != null) {
          console.error(e);
        }
      }
    }
  }

  private async setIdentity(msg: EmigoMessage) {

    // update with identity message
    let emigo: Emigo = getEmigoObject(msg);
    this.identityEmigo.next(emigo);
    this.node = emigo.node;
    this.registry = emigo.registry;
    await this.storeService.setAppProperty(this.emigoId, Prop.IDENTITY, emigo);
    this.revision.identity = emigo.revision;
    await this.storeService.setAppProperty(this.emigoId, Prop.REVISION, this.revision);

    // update registry
    try {
      if(emigo.registry != null) {
        await this.registryService.setMessage(this.registry, msg);
        await this.identityService.clearDirty(this.node, this.token, emigo.revision);
      }
    }
    catch(e) {
      console.log(e);
    }
  }

  public async setContact(emigoId: string) {

    this.emigo = emigoId;
    let contact: EmigoContact = await this.storeService.getContact(this.emigoId, emigoId);
    this.selectedEmigo.next(contact);
  }

  public async setEmigoLabelFilter(l: string) {
    this.emigoLabel = l;
    await this.refreshEmigos();
  }

  public async setEmigoSearchFilter(s: string) {
    this.emigoSearch = s;
    await this.refreshEmigos();
  }

  private async refreshEmigos() {
    
    try {
      // pull filtered emigos
      let filtered: EmigoContact[] = await this.storeService.getContacts(this.emigoId, this.emigoLabel, 
          this.emigoSearch, "connected", null);
      this.filteredEmigos.next(filtered);
    }
    catch(e) {
      console.error(e);
    }
  }

  public async setShowLabelFilter(l: string) {
    this.showLabel = l;
    await this.refreshShowFeed();
  }

  public async setShowSearchFilter(l: string) {
  }

  private async refreshShowFeed() {
    try {
      let subjects: FeedSubjectEntry[] = await this.getShowFeed(this.showLabel, this.showSearch, null);
      this.showSubjects.next(subjects);
    }
    catch(err) {
      console.log(err);
    }
  }

  public async setViewLabelFilter(l: string) {
    this.viewLabel = l;
    await this.refreshViewFeed();
  }

  public async setViewSearchFilter(l: string) {
  }

  private async refreshViewFeed() {
    try {
      let subjects: FeedSubject[] = await this.storeService.getEmigoFeed(this.emigoId, null, 
          this.viewLabel, this.viewSearch, null);
      this.viewSubjects.next(subjects);
    }
    catch(err) {
      console.log(err);
    }
  }

  private async refreshContacts() {

    try {
      // pull unfiltered emigos
      let contacts: EmigoContact[] = await this.storeService.getContacts(this.emigoId, null, null, null, null);
      
      let contact: EmigoContact = null;
      let connected: EmigoContact[] = [];
      let saved: EmigoContact[] = [];
      let received: EmigoContact[] = [];
      let requested: EmigoContact[] = [];
      let all: EmigoContact[] = [];
      let hidden: EmigoContact[] = [];
      for(let i = 0; i < contacts.length; i++) {

        // updated selected contact
        if(this.emigo == contacts[i].emigoId) {
          contact = contacts[i];
        }

        // recevied - received
        if(contacts[i].status == "received") {
          received.push(contacts[i]);
        }

        // requested - requested
        if(contacts[i].status == "requested") {
          requested.push(contacts[i]);
        }

        // connected - connected
        if(contacts[i].status == "connected") {
          connected.push(contacts[i]);
        }

        // saved - null, requesting, requested, receiving, received, closing, closed
        if(contacts[i].status != "connected") {
          saved.push(contacts[i]);
        }

        // any hidden contact
        if(contacts[i].hidden) {
          hidden.push(contacts[i]);
        }

        // add to all list
        all.push(contacts[i]);
      }
      this.selectedEmigo.next(contact);
      this.connectedEmigos.next(connected);
      this.savedEmigos.next(saved);
      this.receivedEmigos.next(received);
      this.requestedEmigos.next(requested);
      this.allEmigos.next(all);
      this.hiddenEmigos.next(hidden);
    }
    catch(e) {
      console.error(e);
    }   
  }

  private async refreshPending() {
   
    try { 
      // pull pending emigos
      let emigos: PendingContact[] = await this.storeService.getPendingContacts(this.emigoId);
      this.pendingEmigos.next(emigos);
    }
    catch(e) {
      console.error(e);
    }
  }

  public async setName(value: string) {
    let msg: EmigoMessage = await this.identityService.setName(this.node, this.token, value);
    await this.setIdentity(msg);
  }

  public async setDescription(value: string) {
    let msg: EmigoMessage = await this.identityService.setDescription(this.node, this.token, value);
    await this.setIdentity(msg);
  }

  public async setLocation(value: string) {
    let msg: EmigoMessage = await this.identityService.setLocation(this.node, this.token, value);
    await this.setIdentity(msg);
  }

  public async setImage(value: string) {
    let msg: EmigoMessage = await this.identityService.setImage(this.node, this.token, value);
    await this.setIdentity(msg);
  }

  public async checkHandle(value: string): Promise<boolean> {
    
    if(this.registry != null) {
      return this.registryService.checkHandle(this.registry, value, this.emigoId);
    }
    return true;
  }

  public async setHandle(value: string) {
   
    // limit race condition where handle gets claimed in registry 
    let check: boolean = await this.checkHandle(value);
    if(!check) {
      throw new Error("handle not available");
    }

    // update handle
    let msg: EmigoMessage = await this.identityService.setHandle(this.node, this.token, value);
    await this.setIdentity(msg);
  }

  public async getLabels(): Promise<LabelEntry[]> {
    return await this.storeService.getLabels(this.emigoId);
  }

  public async getLabel(labelId: string): Promise<LabelEntry> {
    return await this.storeService.getLabel(this.emigoId, labelId);
  }

  public async addLabel(name: string): Promise<LabelEntry> {

    let label: LabelEntry = await this.groupService.addLabel(this.node, this.token, name);
    await this.syncGroup();
    return label;
  }

  public async updateLabel(labelId: string, name: string) {

    let label: LabelEntry = await this.groupService.updateLabel(this.node, this.token, labelId, name);
    await this.syncGroup();
    return label;
  }

  public async removeLabel(labelId: string) {
  
    await this.groupService.removeLabel(this.node, this.token, labelId);
    await this.syncGroup();
  }

  public async getAttributes(): Promise<AttributeEntry[]> {
    return await this.storeService.getAttributes(this.emigoId);
  }

  public async getAttribute(attributeId: string): Promise<AttributeEntry> {
    return await this.storeService.getAttribute(this.emigoId, attributeId);
  }

  public async addAttribute(schema: string, data: string): Promise<AttributeEntry> {
    
    let attribute: AttributeEntry = await this.profileService.addAttribute(this.node, this.token, schema, data);
    await this.syncProfile();
    return attribute;
  }

  public async updateAttribute(attributeId: string, schema: string, data: string): Promise<AttributeEntry> {
    
    let attribute: AttributeEntry = await this.profileService.updateAttribute(this.node, this.token, attributeId, schema, data);
    await this.syncProfile();
    return attribute;
  }

  public async removeAttribute(attributeId: string) {
   
    await this.profileService.removeAttribute(this.node, this.token, attributeId);
    await this.syncProfile();
  }

  public async setAttributeLabels(attributeId: string, labelIds: string[]): Promise<AttributeEntry> {
    
    let entry: AttributeEntry = await this.profileService.setAttributeLabels(this.node, this.token, attributeId, labelIds);
    await this.syncProfile();
    return entry;
  }

  public async setAttributeLabel(attributeId: string, labelId: string): Promise<AttributeEntry> {
    
    let entry: AttributeEntry = await this.profileService.setAttributeLabel(this.node, this.token, attributeId, labelId);
    await this.syncProfile();
    return entry;
  }

  public async clearAttributeLabel(attributeId: string, labelId: string): Promise<AttributeEntry> {
    
    let entry: AttributeEntry = await this.profileService.clearAttributeLabel(this.node, this.token, attributeId, labelId);
    await this.syncProfile();
    return entry;
  }

  public async addSubject(schema: string): Promise<SubjectEntry> {

    let entry: SubjectEntry = await this.showService.addSubject(this.node, this.token, schema);
    await this.storeService.addSubject(this.emigoId, entry, this.searchableSubject);
    await this.refreshShowFeed();
    return entry;
  }

  public async getSubject(subjectId: string): Promise<SubjectEntry> {
    return await this.storeService.getSubject(this.emigoId, subjectId);
  }

  public async updateSubject(subjectId: string): Promise<FeedSubjectEntry> {
  
    // refresh unversioned asset state (asset state not versioned)
    let entry: SubjectEntry = await this.showService.getSubject(this.node, this.token, subjectId);
    let stored: SubjectEntry = await this.storeService.getSubject(this.emigoId, subjectId);
    await this.storeService.updateSubject(this.emigoId, entry, this.searchableSubject);
    if(entry.subject.revision != stored.subject.revision) {
      await this.refreshShowFeed();
    }
    return await this.storeService.getFeedSubjectEntry(this.emigoId, subjectId);
  }

  public async updateSubjectData(subjectId: string, schema: string, data: string): Promise<SubjectEntry> {
  
    let entry: SubjectEntry = await this.showService.updateSubjectData(this.node, this.token, subjectId, schema, data);
    await this.storeService.updateSubject(this.emigoId, entry, this.searchableSubject);
    await this.refreshShowFeed();
    return entry;
  }

  public async updateSubjectShare(subjectId: string, share: boolean): Promise<SubjectEntry> {

    let entry: SubjectEntry = await this.showService.updateSubjectShare(this.node, this.token, subjectId, share);
    await this.storeService.updateSubject(this.emigoId, entry, this.searchableSubject);
    await this.refreshShowFeed();
    return entry;
  }

  public async updateSubjectExpire(subjectId: string, expire: number): Promise<SubjectEntry> {

    let entry: SubjectEntry = await this.showService.updateSubjectExpire(this.node, this.token, subjectId, expire);
    await this.storeService.updateSubject(this.emigoId, entry, this.searchableSubject);
    await this.refreshShowFeed();
    return entry;
  }

  public async removeSubject(subjectId: string): Promise<void> {

    await this.showService.removeSubject(this.node, this.token, subjectId);
    await this.storeService.removeSubject(this.emigoId, subjectId);
    await this.refreshShowFeed();
  }

  public async removeSubjectAsset(subjectId: string, assetId: string): Promise<void> {

    await this.showService.removeSubjectAsset(this.node, this.token, subjectId, assetId);
    await this.refreshShowFeed();
  }

  public async setSubjectLabels(subjectId: string, labelIds: string[]): Promise<SubjectEntry> {

    let entry: SubjectEntry = await this.showService.setSubjectLabels(this.node, this.token, subjectId, labelIds);
    await this.storeService.updateSubject(this.emigoId, entry, this.searchableSubject);
    await this.refreshShowFeed();
    return entry;
  }

  public async setSubjectLabel(subjectId: string, labelId: string): Promise<SubjectEntry> {

    let entry: SubjectEntry = await this.showService.setSubjectLabel(this.node, this.token, subjectId, labelId);
    await this.storeService.updateSubject(this.emigoId, entry, this.searchableSubject);
    await this.refreshShowFeed();
    return entry;
  }

  public async clearSubjectLabel(subjectId: string, labelId: string): Promise<SubjectEntry> {

    let entry: SubjectEntry = await this.showService.clearSubjectLabel(this.node, this.token, subjectId, labelId);
    await this.storeService.updateSubject(this.emigoId, entry, this.searchableSubject);
    await this.refreshShowFeed();
    return entry;
  }

  public async getSubjectTags(subjectId: string): Promise<Tag[]> {
    return await this.storeService.getSubjectTags(this.emigoId, subjectId);
  }

  public async getEmigoSubjectTags(emigoId: string, subjectId: string): Promise<Tag[]> {
    return await this.storeService.getEmigoSubjectTags(this.emigoId, emigoId, subjectId);
  }

  public async addSubjectTag(subjectId: string, data: string): Promise<Tag[]> {
    let t = await this.showService.addSubjectTag(this.node, this.token, subjectId, this.tagFilter, data);
    await this.storeService.updateSubjectTags(this.emigoId, subjectId, t.revision, t.tags);
    await this.refreshShowFeed();
    return t.tags;
  }

  public async addEmigoSubjectTag(emigoId: string, subjectId: string, data: string): Promise<Tag[]> {
    let update: EmigoUpdate = await this.storeService.getEmigoUpdate(this.emigoId, emigoId);
    let t = await this.viewService.addSubjectTags(this.serviceNode, this.serviceToken, update.node, update.token,
        subjectId, this.tagFilter, data);
    await this.storeService.updateEmigoSubjectTags(this.emigoId, emigoId, subjectId, t.revision, t.tags);
    await this.refreshViewFeed();
    return t.tags;
  }

  public async removeSubjectTag(subjectId: string, tagId: string): Promise<Tag[]> {
    let t = await this.showService.removeSubjectTag(this.node, this.token, subjectId, tagId, this.tagFilter);
    await this.storeService.updateSubjectTags(this.emigoId, subjectId, t.revision, t.tags);
    await this.refreshShowFeed();
    return t.tags;
  }

  public async removeEmigoSubjectTag(emigoId: string, subjectId: string, tagId: string): Promise<Tag[]> {
    let update: EmigoUpdate = await this.storeService.getEmigoUpdate(this.emigoId, emigoId);
    let t = await this.viewService.removeSubjectTags(this.serviceNode, this.serviceToken, update.node, update.token,
        subjectId, tagId, this.tagFilter);
    await this.storeService.updateEmigoSubjectTags(this.emigoId, emigoId, subjectId, t.revision, t.tags);
    await this.refreshViewFeed();
    return t.tags;
  }

  public getUploadUrl(subjectId: string, transforms: string[]): string {
    return this.showService.getUploadUrl(this.node, this.token, subjectId, transforms);
  }

  public getLogoUrl(revision: number): string {
    return this.identityService.getImageUrl(this.node, this.token, revision);
  } 

  public getEmigoLogoUrl(emigoId: string, revision: number): string {
    return this.indexService.getEmigoLogoUrl(this.node, this.token, emigoId, revision);
  }

  public getShowAssetUrl(subjectId: string, assetId: string): string {
    return this.showService.getAssetUrl(this.node, this.token, subjectId, assetId);
  }

  public async getViewAssetUrl(emigoId: string, subjectId: string, assetId: string): Promise<string> {

    let update: EmigoUpdate = await this.storeService.getEmigoUpdate(this.emigoId, emigoId);
    return await this.viewService.getAssetUrl(this.serviceNode, this.serviceToken, update.node, update.token, 
        subjectId, assetId);
  }

  public async addConnection(emigo: string): Promise<ShareEntry> {
    
    let share: ShareEntry = await this.shareService.addConnection(this.node, this.token, emigo);
    await this.syncShare();
    return share;
  }

  public async openConnection(emigo: string, share: string, node: string): Promise<string> {

    let entry: ShareEntry = await this.shareService.updateStatus(this.node, this.token, share, "requesting", null);
    await this.syncShare();

    let msg: ShareMessage = await this.shareService.getMessage(this.node, this.token, share);
    let status: ShareStatus = await this.shareService.setMessage(node, emigo, msg);
    if(status.shareStatus == ShareStatus.ShareStatusEnum.Connected) {
      await this.shareService.updateStatus(this.node, this.token, share, "connected", status.connected);
      await this.syncShare();
      return "connected";
    }
    if(status.shareStatus == ShareStatus.ShareStatusEnum.Closed) {
      await this.shareService.updateStatus(this.node, this.token, share, "closed", null);
      await this.syncShare();
      return "closed";
    }
    if(status.shareStatus == ShareStatus.ShareStatusEnum.Received) {
      await this.shareService.updateStatus(this.node, this.token, share, "requested", null);
      await this.syncShare();
      return "requested";
    }
    throw new Error("unexpected connection state");
  }

  public async closeConnection(emigo: string, share: string, node: string): Promise<string> {

    let entry: ShareEntry = await this.shareService.updateStatus(this.node, this.token, share, "closing", null);
  
    try {
      let msg: ShareMessage = await this.shareService.getMessage(this.node, this.token, share);
      let status: ShareStatus = await this.shareService.setMessage(node, emigo, msg);
      if(status.shareStatus == ShareStatus.ShareStatusEnum.Closed) {
        await this.shareService.updateStatus(this.node, this.token, share, "closed", null);
        await this.syncShare();
        return "closed";
      }
      console.error("unexpected connection state");
      await this.syncShare();
      return "closing";
    }
    catch(e) {
      console.error(e);
      await this.syncShare();
      return "closing";
    }
  }

  public async removeConnection(emigo: string, share: string) {

    await this.shareService.removeConnection(this.node, this.token, share);
    await this.syncShare();
  }

  public async getEmigo(emigoId: string): Promise<EmigoEntry> {
    return await this.storeService.getEmigo(this.emigoId, emigoId);
  }

  public async addEmigo(msg: EmigoMessage): Promise<EmigoEntry> {

    let entry: EmigoEntry = await this.indexService.addEmigo(this.node, this.token, msg);
    await this.syncIndex();
    await this.syncShare();
    let update = await this.storeService.getEmigoUpdate(this.emigoId, entry.emigoId);
    await this.syncEmigoIdentity(update);
    return entry;
  }

  public async updateEmigoNotes(emigoId: string, notes: string): Promise<EmigoEntry> {
    
    let entry: EmigoEntry = await this.indexService.setEmigoNotes(this.node, this.token, emigoId, notes);
    await this.syncIndex();
    return entry;
  }

  public async removeEmigo(emigoId: string) {

    await this.indexService.removeEmigo(this.node, this.token, emigoId);
    await this.syncIndex();
  }

  public async setEmigoLabels(emigoId: string, labelIds: string[]): Promise<EmigoEntry> {

    let view: EmigoEntry = await this.indexService.setEmigoLabels(this.node, this.token, emigoId, labelIds);
    await this.syncIndex();
    return view;
  }

  public async setEmigoLabel(emigoId: string, labelId: string): Promise<EmigoEntry> {

    let view: EmigoEntry = await this.indexService.setEmigoLabel(this.node, this.token, emigoId, labelId);
    await this.syncIndex();
    return view;
  }

  public async clearEmigoLabel(emigoId: string, labelId: string): Promise<EmigoEntry> {

    let view: EmigoEntry = await this.indexService.clearEmigoLabel(this.node, this.token, emigoId, labelId);
    await this.syncIndex();
    return view;
  }

  public async getPending(shareId: string): Promise<PendingEmigo> {
    return await this.storeService.getPending(this.emigoId, shareId);
  }

  public async clearEmigoRequest(shareId: string) {

    await this.indexService.clearRequest(this.node, this.token, shareId);
    await this.syncIndex();
  }

  public async setContactShareData(share: string, obj: any): Promise<void> {
    await this.storeService.setShareData(this.emigoId, share, obj);
    this.refreshEmigos();
  }

  public async setPendingEmigoData(share: string, obj: any): Promise<void> {
    await this.storeService.setPendingData(this.emigoId, share, obj);
  }

  public async setEmigoFeed(emigo: string, hidden: boolean) {
    await this.storeService.setEmigoFeed(this.emigoId, emigo, hidden);
    this.refreshContacts();
    this.refreshViewFeed();
  }

  public async setContactIdentityData(emigo: string, obj: any): Promise<void> {
    await this.storeService.setEmigoIdentityData(this.emigoId, emigo, obj);
    this.refreshEmigos();
  }

  public async getContactIdentity(emigo: string): Promise<Emigo> {
    return await this.storeService.getEmigoIdentity(this.emigoId, emigo);
  }

  public async getContactShare(emigo: string): Promise<ShareEntry> {
    return await this.storeService.getEmigoShare(this.emigoId, emigo);
  }

  public async setContactProfileData(emigo: string, obj: any): Promise<void> {
    await this.storeService.setEmigoAttributeData(this.emigoId, emigo, obj);
    this.refreshEmigos();
  }

  public async getContactProfile(emigo: string): Promise<Attribute[]> {
    return await this.storeService.getEmigoAttributes(this.emigoId, emigo);
  }

  public async setViewSubjectFeed(emigo: string, subject: string, hidden: boolean) {
    await this.storeService.setViewSubjectFeed(this.emigoId, emigo, subject, hidden);
    this.refreshViewFeed();
  }

  public async getShowFeedSubject(subjectId: string): Promise<FeedSubjectEntry> {
    return await this.storeService.getFeedSubjectEntry(this.emigoId, subjectId);
  }

  public async getContact(emigoId: string): Promise<EmigoContact> {
    return await this.storeService.getContact(this.emigoId, emigoId);
  }
  
  public async getContacts(label: string, search: string, status: string, hidden: boolean): Promise<EmigoContact[]> {
    return await this.storeService.getContacts(this.emigoId, label, search, status, hidden);
  }

  public async getShowFeed(label: string, search: string, limit: number): Promise<FeedSubjectEntry[]> {
    return await this.storeService.getSubjectFeed(this.emigoId, label, search, limit);
  }

  public async getViewFeed(emigo: string, label:string, search: string, limit: number): Promise<FeedSubject[]> {
    return await this.storeService.getEmigoFeed(this.emigoId, emigo, label, search, limit);
  }

  public async getHiddenFeed(label: string, search: string, limit: number): Promise<FeedSubject[]> {
    return await this.storeService.getHiddenFeed(this.emigoId, label, search, limit);
  }

  private async syncChanges() {
      
    console.log("sync changes");
    try {

      // sync all modules
      await this.syncIdentity();
      await this.syncGroup();
      await this.syncShare();
      await this.syncIndex();
      await this.syncProfile();
      await this.syncShow();

      // retrieve any stale contact
      let d: Date = new Date();
      let cur: number = Math.floor(d.getTime() / 1000);
      let updates: EmigoUpdate[] = await this.storeService.getStaleEmigos(this.emigoId, cur - this.stale);

      for(let i = 0; i < updates.length; i++) {

        // set updated timestamp
        await this.storeService.setEmigoUpdateTimestamp(this.emigoId, updates[i].emigoId, cur);
 
        // update identity
        await this.syncEmigoIdentity(updates[i]);

        // update attributes
        await this.syncEmigoAttributes(updates[i]);

        // update subjects
        await this.syncEmigoSubjects(updates[i]);

      }
    }
    catch(e) {
      if(this.emigoId != null) {
        console.error(e);
      }
    }
    console.log("sync changes: done");
  }

  public async refreshContact(emigo: string) {

    // update profile of specified contact
    let d: Date = new Date();
    let cur: number = Math.floor(d.getTime() / 1000);
    try {
      let update: EmigoUpdate = await this.storeService.getEmigoUpdate(this.emigoId, emigo);
      await this.storeService.setEmigoUpdateTimestamp(this.emigoId, update.emigoId, cur);
      await this.syncEmigoIdentity(update);
      await this.syncEmigoAttributes(update);
      await this.syncEmigoSubjects(update);
    }
    catch(err) {
      console.log(err);
    }
  }

  public async refreshAllContacts() {
  
    // retrieve any stale contact
    let d: Date = new Date();
    let cur: number = Math.floor(d.getTime() / 1000);
    let updates: EmigoUpdate[] = await this.storeService.getStaleEmigos(this.emigoId, cur);

    // sync each view
    for(let i = 0; i < updates.length; i++) {

      try {

        // set updated timestamp
        await this.storeService.setEmigoUpdateTimestamp(this.emigoId, updates[i].emigoId, cur);

        // update identity
        await this.syncEmigoIdentity(updates[i]);

        // update attributes
        await this.syncEmigoAttributes(updates[i]);

        // update subjects
        await this.syncEmigoSubjects(updates[i]);
      }
      catch(e) {
        console.log(e);
      }
    }

    // lag a little for visual
    await this.delay(2000);
  }

  private async asyncForEach(map, handler) {
    
    let arr = [];
    map.forEach((value, key) => {
      arr.push({ id: key, obj: value });
    });
    for(let i = 0; i < arr.length; i++) {
      await handler(arr[i].obj, arr[i].id);
    }
  }

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms)); 
  } 

}





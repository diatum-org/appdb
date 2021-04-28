import { Injectable, Type, Component } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse, HttpEvent } from '@angular/common/http';
import { HttpUrlEncodingCodec } from '@angular/common/http';
import { ImageSource, fromBase64 } from "tns-core-modules/image-source";

import { getAmigoObject } from './amigo.util';

import { Amigo } from './amigo';
import { AmigoMessage } from './amigoMessage';
import { ServiceAccess } from './serviceAccess';
import { LabelEntry } from './labelEntry';
import { AmigoEntry } from './amigoEntry';
import { AmigoView } from './amigoView';
import { Attribute } from './attribute';
import { AttributeEntry } from './attributeEntry';
import { AttributeView } from './attributeView';
import { Subject } from './subject';
import { SubjectEntry } from './subjectEntry';
import { SubjectView } from './subjectView';
import { PendingAmigo } from './pendingAmigo';
import { PendingAmigoView } from './pendingAmigoView';
import { ShareEntry } from './shareEntry';
import { ShareStatus } from './shareStatus';
import { ShareMessage } from './shareMessage';
import { ShareView } from './shareView';
import { LabelView } from './labelView';
import { SubjectTag } from './subjectTag';
import { Tag } from './tag';

import { FeedSubject } from './feedSubject';
import { FeedSubjectEntry } from './feedSubjectEntry';
import { AmigoContact } from './amigoContact';
import { PendingContact } from './pendingContact';

import { StoreService, IdRevision, AmigoUpdate } from './store.service';
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

export class AmigoSubjectId {
  amigoId: string;  
  subjectId: string
}

class MapEntry{
  id: string;
  value: any;
}

@Injectable()
export class AmigoService {

  private amigoId: string; // active account
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
  private amigo: string;
  private amigoLabel: string;
  private amigoSearch: string;
  private showLabel: string;
  private showSearch: string;
  private viewLabel: string;
  private viewSearch: string;
  private syncInterval: any;
  private searchableSubject: any;
  private searchableAmigo: any;

  private selectedAmigo: BehaviorSubject<AmigoContact>;
  private attributeEntries: BehaviorSubject<AttributeEntry[]>;
  private labelEntries: BehaviorSubject<LabelEntry[]>;
  private filteredAmigos: BehaviorSubject<AmigoContact[]>;
  private connectedAmigos: BehaviorSubject<AmigoContact[]>;
  private requestedAmigos: BehaviorSubject<AmigoContact[]>;
  private receivedAmigos: BehaviorSubject<AmigoContact[]>;
  private savedAmigos: BehaviorSubject<AmigoContact[]>;
  private allAmigos: BehaviorSubject<AmigoContact[]>;
  private hiddenAmigos: BehaviorSubject<AmigoContact[]>;
  private pendingAmigos: BehaviorSubject<PendingContact[]>;
  private identityAmigo: BehaviorSubject<Amigo>;
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

    this.selectedAmigo = new BehaviorSubject<AmigoContact>(null);
    this.attributeEntries = new BehaviorSubject<AttributeEntry[]>([]);
    this.labelEntries = new BehaviorSubject<LabelEntry[]>([]);
    this.filteredAmigos = new BehaviorSubject<AmigoContact[]>([]);
    this.connectedAmigos = new BehaviorSubject<AmigoContact[]>([]);
    this.requestedAmigos = new BehaviorSubject<AmigoContact[]>([]);
    this.receivedAmigos = new BehaviorSubject<AmigoContact[]>([]);
    this.savedAmigos = new BehaviorSubject<AmigoContact[]>([]);
    this.allAmigos = new BehaviorSubject<AmigoContact[]>([]);
    this.hiddenAmigos = new BehaviorSubject<AmigoContact[]>([]);
    this.pendingAmigos = new BehaviorSubject<PendingContact[]>([]);
    this.showSubjects = new BehaviorSubject<FeedSubjectEntry[]>([]);
    this.viewSubjects = new BehaviorSubject<FeedSubject[]>([]);
    this.identityAmigo = new BehaviorSubject<Amigo>(null);
    this.syncInterval = null;
  }

  get identity() {
    return this.identityAmigo.asObservable();
  }

  get labels() {
    return this.labelEntries.asObservable();
  }

  get attributes() {
    return this.attributeEntries.asObservable();
  }

  get selectedContact() {
    return this.selectedAmigo.asObservable();
  }

  get filteredContacts() {
    return this.filteredAmigos.asObservable();
  }

  get connectedContacts() {
    return this.connectedAmigos.asObservable();
  }

  get requestedContacts() {
    return this.requestedAmigos.asObservable();
  }

  get receivedContacts() {
    return this.receivedAmigos.asObservable();
  }

  get savedContacts() {
    return this.savedAmigos.asObservable();
  }

  get allContacts() {
    return this.allAmigos.asObservable();
  }

  get hiddenContacts() {
    return this.hiddenAmigos.asObservable();
  }

  get pendingContacts() {
    return this.pendingAmigos.asObservable();
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
    return this.storeService.setAppProperty(this.amigoId, "app_" + key, obj);
  }

  public getAppProperty(key: string): Promise<any> {
    return this.storeService.getAppProperty(this.amigoId, "app_" + key);
  }

  public clearAppProperty(key: string, obj: any): Promise<void> {
    return this.storeService.clearAppProperty(this.amigoId, "app_" + key);
  }

  // set account, validate token, return permissions, and periodically synchronize
  public async setAmigo(amigoId: string, registry: string, token: string, serviceNode: string, serviceToken: string, 
      attributeFilter: string[], subjectFilter: string[], tagFilter: string,
      searchableAmigo: any, searchableSubject: any,
      stale: number = 86400, refresh: number = 60) {

    // clear any perviously set account
    this.clearAmigo();
    
    // set new account
    this.amigoId = amigoId;
    this.token = token;
    this.registry = registry;
    this.serviceNode = serviceNode;
    this.serviceToken = serviceToken;
    this.attributeFilter = attributeFilter;
    this.subjectFilter = subjectFilter;
    this.tagFilter = tagFilter;
    this.searchableAmigo = searchableAmigo;
    this.searchableSubject = searchableSubject;
    this.stale = stale;

    // init sync revision for each module
    this.revision = { identity: 0, group: 0, index: 0, profile: 0, show: 0, share: 0 };

    // import account if access and identity have not already been stored
    let access: ServiceAccess = await this.storeService.setAccount(amigoId);
    let amigo: Amigo = await this.storeService.getAppProperty(this.amigoId, Prop.IDENTITY);
    if(access == null || amigo == null) {

      // retrieve identity
      let msg: AmigoMessage = await this.registryService.getMessage(registry, this.amigoId);
      amigo = getAmigoObject(msg);
      this.identityAmigo.next(amigo);
      this.node = amigo.node;
      this.registry = amigo.registry;
      await this.storeService.setAppProperty(this.amigoId, Prop.IDENTITY, amigo);
      this.revision.identity = amigo.revision;
      this.identityAmigo.next(amigo);

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
      this.identityAmigo.next(amigo);
      this.registry = amigo.registry;
      this.node = amigo.node;
      this.identityAmigo.next(amigo);

      // retrieve attributes
      let a: AttributeEntry[] = await this.storeService.getAttributes(this.amigoId);
      this.attributeEntries.next(a);

      // retrieve labels
      let l: LabelEntry[] = await this.storeService.getLabels(this.amigoId);
      this.labelEntries.next(l);

      // refresh contacts
      this.refreshAmigos();
      this.refreshContacts();
      this.refreshPending();
      this.refreshShowFeed();
      this.refreshViewFeed();

      // retrieve revision
      let r = await this.storeService.getAppProperty(this.amigoId, Prop.REVISION);
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
  public clearAmigo(): void {

    if(this.syncInterval != null) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    this.viewService.clearAuth();
    this.contactService.clearAuth();

    this.amigoLabel = null;
    this.amigoSearch = null;
    this.showLabel = null;
    this.showSearch = null;
    this.viewLabel = null;
    this.viewSearch = null;
    this.amigoId = null;
    this.selectedAmigo.next(null);
    this.labelEntries.next([]);
    this.attributeEntries.next([]);
    this.filteredAmigos.next([]);
    this.connectedAmigos.next([]);
    this.receivedAmigos.next([]);
    this.requestedAmigos.next([]);
    this.savedAmigos.next([]);
    this.allAmigos.next([]);
    this.pendingAmigos.next([]);
    this.showSubjects.next([]);
    this.viewSubjects.next([]);
    this.identityAmigo.next(null);
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
      let updates: AmigoUpdate[] = await this.storeService.getAmigoUpdates(this.amigoId);
      for(let i = 0; i < updates.length; i++) {

        // update identity
        await this.syncAmigoIdentity(updates[i]);

        // update attributes
        await this.syncAmigoAttributes(updates[i]);

        // update subjects
        await this.syncAmigoSubjects(updates[i]);

        // set updated timestamp
        await this.storeService.setAmigoUpdateTimestamp(this.amigoId, updates[i].amigoId, cur);
      }

      // store revision
      await this.storeService.setAppProperty(this.amigoId, Prop.REVISION, this.revision);

      // store access
      await this.storeService.setAppAccount(this.amigoId, this.access);
    }
    catch(e) {
      console.log("import failed");
      console.log(e);
    }
  }

  private async syncAmigoIdentity(update: AmigoUpdate) {

    // sync with index
    if(this.access.enableIndex == true) {

      // flag if contacts should refresh
      let refresh: boolean = false;

      try {
        let indexRevision: number = await this.indexService.getAmigoRevision(this.node, this.token, update.amigoId);
        if(indexRevision != update.identityRevision) {
          let amigo: Amigo = await this.indexService.getAmigoIdentity(this.node, this.token, update.amigoId);
          update.node = amigo.node;
          update.registry = amigo.registry;
          update.identityRevision = amigo.revision;
          await this.storeService.setAmigoIdentity(this.amigoId, update.amigoId, amigo, this.searchableAmigo);
          update.identityRevision = indexRevision;
          refresh = true;
        }

        // sync with registry
        if(update.registry != null) {
          let registryRevision: number = await this.registryService.getRevision(update.registry, update.amigoId);
          if(registryRevision != update.identityRevision) {
            let msg: AmigoMessage = await this.registryService.getMessage(update.registry, update.amigoId);
            let amigo: Amigo = await this.indexService.setAmigo(this.node, this.token, msg);
            update.node = amigo.node;
            update.registry = amigo.registry;
            update.identityRevision = amigo.revision;
            await this.storeService.setAmigoIdentity(this.amigoId, update.amigoId, amigo, this.searchableAmigo);
            update.identityRevision = registryRevision;
            refresh = true;
          }
        }

        // if contacts should refresh
        if(refresh) {
          await this.refreshAmigos();
          await this.refreshContacts();
        }
      }
      catch(e) {
        if(this.amigoId != null) {
          console.error(e);
        }
      }
    }
  }

  private async syncAmigoAttributes(update: AmigoUpdate) {

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
          let local: AttributeView[] = await this.storeService.getAmigoAttributeViews(this.amigoId, update.amigoId);
          let localMap: Map<string, number> = new Map<string, number>();
          for(let i = 0; i < local.length; i++) {
            localMap.set(local[i].attributeId, local[i].revision);
          }

          // add remote entry not in local
          await this.asyncForEach(remoteMap, async (value, key) => {
            if(!localMap.has(key)) {
              let a: Attribute = await this.contactService.getAttribute(this.serviceNode, this.serviceToken,
                update.node, update.token, key);
              await this.storeService.addAmigoAttribute(this.amigoId, update.amigoId, a);
              refresh = true;
            }
            else if(localMap.get(key) != value) {
              let a: Attribute = await this.contactService.getAttribute(this.serviceNode, this.serviceToken,
                update.node, update.token, key);
              await this.storeService.updateAmigoAttribute(this.amigoId, update.amigoId, a);
              refresh = true;
            }
          });

          // remove any local entry not in remote
          await this.asyncForEach(localMap, async (value, key) => {
            if(!remoteMap.has(key)) {
              await this.storeService.removeAmigoAttribute(this.amigoId, update.amigoId, key);
              refresh = true;
            }
          });

          // set updated revision
          await this.storeService.setAmigoAttributeRevision(this.amigoId, update.amigoId, revision);
          update.attributeRevision = revision;
        }
      }
      else {

        // remove any attributes
        let local: AttributeView[] = await this.storeService.getAmigoAttributeViews(this.amigoId, update.amigoId);
        for(let i = 0; i < local.length; i++) {
          await this.storeService.removeAmigoAttribute(this.amigoId, update.amigoId, local[i].attributeId);
          refresh = true;
        }
        
        // clear revision
        if(update.attributeRevision != null) {  
          await this.storeService.setAmigoAttributeRevision(this.amigoId, update.amigoId, null);
        }
      }

      // refresh contacst
      if(refresh) {
        await this.refreshAmigos();
        await this.refreshContacts();
      }
    }
    catch(e) {
      if(this.amigoId != null) {
        console.error(e);
      }
    }
  }

  private async syncAmigoSubjects(update: AmigoUpdate) {

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
          let local: SubjectView[] = await this.storeService.getAmigoSubjectViews(this.amigoId, update.amigoId);
          let localMap: Map<string, any> = new Map<string, any>();
          for(let i = 0; i < local.length; i++) {
            localMap.set(local[i].subjectId, { subject: local[i].revision, tag: local[i].tagRevision });
          }

          // add remote entry not in local
          await this.asyncForEach(remoteMap, async (value, key) => {
            if(!localMap.has(key)) {
              let subject: Subject = await this.viewService.getSubject(this.serviceNode, this.serviceToken, update.node, update.token, key);
              await this.storeService.addAmigoSubject(this.amigoId, update.amigoId, subject, this.searchableSubject);
              if(value.tag != null) {
                let tag: SubjectTag = await this.viewService.getSubjectTags(this.serviceNode, this.serviceToken, update.node, update.token, 
                    key, this.tagFilter);
                await this.storeService.updateAmigoSubjectTags(this.amigoId, update.amigoId, key, tag.revision, tag.tags);
              }
              refresh = true;
            }
            else {
              if(localMap.get(key).subject != value.subject) {
                let subject: Subject = await this.viewService.getSubject(this.serviceNode, this.serviceToken, update.node, update.token, key);
                await this.storeService.updateAmigoSubject(this.amigoId, update.amigoId, subject, this.searchableSubject);
                refresh = true;
              }

              if(localMap.get(key).tag != value.tag) {
                let tag: SubjectTag = await this.viewService.getSubjectTags(this.serviceNode, this.serviceToken, update.node, update.token, 
                    key, this.tagFilter);
                await this.storeService.updateAmigoSubjectTags(this.amigoId, update.amigoId, key, tag.revision, tag.tags);
                refresh = true;
              }
            }
          });

          // remove any local entry not in remote
          await this.asyncForEach(localMap, async (value, key) => {
            if(!remoteMap.has(key)) {
              await this.storeService.removeAmigoSubject(this.amigoId, update.amigoId, key);
              refresh = true;
            }
          });

          // set updated revision
          await this.storeService.setAmigoSubjectRevision(this.amigoId, update.amigoId, revision);
          update.subjectRevision = revision;
        }
      }
      else {

        // remove any subjects
        let local: SubjectView[] = await this.storeService.getAmigoSubjectViews(this.amigoId, update.amigoId);
        for(let i = 0; i < local.length; i++) {
          await this.storeService.removeAmigoSubject(this.amigoId, update.amigoId, local[i].subjectId);
          refresh = true;
        }

        // clear revision
        if(update.subjectRevision != null) {
          await this.storeService.setAmigoSubjectRevision(this.amigoId, update.amigoId, null);
        }
      }

      // refresh contacts
      if(refresh) {
        this.refreshViewFeed();
      }
    }
    catch(e) {
      if(this.amigoId != null) {
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
          let local: SubjectView[] = await this.storeService.getSubjectViews(this.amigoId);
          let localMap: Map<string, any> = new Map<string, any>();
          for(let i = 0; i < local.length; i++) {
            localMap.set(local[i].subjectId, { subject: local[i].revision, tag: local[i].tagRevision });
          }

          // add remote entry not in local
          await this.asyncForEach(remoteMap, async (value, key) => {

            if(!localMap.has(key)) {
              let entry: SubjectEntry = await this.showService.getSubject(this.node, this.token, key);
              await this.storeService.addSubject(this.amigoId, entry, this.searchableSubject);
              await this.storeService.clearSubjectLabels(this.amigoId, key);
              for(let i = 0; i < entry.labels.length; i++) {
                await this.storeService.setSubjectLabel(this.amigoId, key, entry.labels[i]);
              }
              if(value.tag != 0) {
                let tag: SubjectTag = await this.showService.getSubjectTags(this.node, this.token, key, this.tagFilter);
                await this.storeService.updateSubjectTags(this.amigoId, key, tag.revision, tag.tags);
              }
              refresh = true;
            }
            else {
              if(localMap.get(key).subject != value.subject) {
                let entry: SubjectEntry = await this.showService.getSubject(this.node, this.token, key);
                await this.storeService.updateSubject(this.amigoId, entry, this.searchableSubject);
                await this.storeService.clearSubjectLabels(this.amigoId, key);
                for(let i = 0; i < entry.labels.length; i++) {
                  await this.storeService.setSubjectLabel(this.amigoId, key, entry.labels[i]);
                }
                refresh = true;
              }

              if(localMap.get(key).tag != value.tag) {
                let tag: SubjectTag = await this.showService.getSubjectTags(this.node, this.token, key, this.tagFilter);
                await this.storeService.updateSubjectTags(this.amigoId, key, tag.revision, tag.tags);
                refresh = true;
              }
            }
          });

          // remove any local entry not in remote
          await this.asyncForEach(localMap, async (value, key) => {
            if(!remoteMap.has(key)) {
              await this.storeService.removeSubject(this.amigoId, key);
              refresh = true;
            }
          });

          // refresh feed
          if(refresh) {
            await this.refreshShowFeed();
          }

          // upldate group revision
          this.revision.show = r;
          await this.storeService.setAppProperty(this.amigoId, Prop.REVISION, this.revision);
        }
      }
      catch(e) {
        if(this.amigoId != null) {
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
          let local: AttributeView[] = await this.storeService.getAttributeViews(this.amigoId);
          let localMap: Map<string, number> = new Map<string, number>();
          for(let i = 0; i < local.length; i++) {
            localMap.set(local[i].attributeId, local[i].revision);
          }

          await this.asyncForEach(remoteMap, async (value, key) => {

            if(!localMap.has(key)) {

              // add any remote entry not local
              let entry: AttributeEntry = await this.profileService.getAttribute(this.node, this.token, key);
              await this.storeService.addAttribute(this.amigoId, entry.attribute);
              await this.storeService.clearAttributeLabels(this.amigoId, entry.attribute.attributeId);
              for(let i = 0; i < entry.labels.length; i++) {
                await this.storeService.setAttributeLabel(this.amigoId, key, entry.labels[i]);
              }
              refresh = true;  
            }
            else if(localMap.get(key) != value) {

              // update any entry with different revision
              let entry: AttributeEntry = await this.profileService.getAttribute(this.node, this.token, key);
              await this.storeService.updateAttribute(this.amigoId, entry.attribute);
              await this.storeService.clearAmigoLabels(this.amigoId, entry.attribute.attributeId);
              for(let i = 0; i < entry.labels.length; i++) {
                await this.storeService.setAttributeLabel(this.amigoId, entry.attribute.attributeId, entry.labels[i]);
              }
              refresh = true
            }
          });

          // remove any local entry not in remote
          await this.asyncForEach(localMap, async (value, key) => {
            if(!remoteMap.has(key)) {
              await this.storeService.removeAttribute(this.amigoId, key);
              refresh = true;
            }
          });

          // upldate group revision
          this.revision.profile = r;
          await this.storeService.setAppProperty(this.amigoId, Prop.REVISION, this.revision);
          
          // push attributes to app
          if(refresh) {
            let entries: AttributeEntry[] = await this.storeService.getAttributes(this.amigoId);
            this.attributeEntries.next(entries);
          }
        }
      }
      catch(e) {
        if(this.amigoId != null) {
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

          // flag if amigos should refresh
          let refresh: boolean = false;

          // get remote view
          let remote: AmigoView[] = await this.indexService.getAmigoViews(this.node, this.token);
          let remoteMap: Map<string, number> = new Map<string, number>();
          for(let i = 0; i < remote.length; i++) {
            remoteMap.set(remote[i].amigoId, remote[i].revision);
          }

          // get local view
          let local: AmigoView[] = await this.storeService.getAmigoViews(this.amigoId);
          let localMap: Map<string, number> = new Map<string, number>();
          for(let i = 0; i < local.length; i++) {
            localMap.set(local[i].amigoId, local[i].revision);
          }

          await this.asyncForEach(remoteMap, async (value, key) => {
          
            if(!localMap.has(key)) {
              
              // add any remote entry not local
              let amigo: AmigoEntry = await this.indexService.getAmigo(this.node, this.token, key);
              await this.storeService.addAmigo(this.amigoId, amigo.amigoId, amigo.notes, amigo.revision);
              await this.storeService.clearAmigoLabels(this.amigoId, amigo.amigoId);
              for(let i = 0; i < amigo.labels.length; i++) {
                await this.storeService.setAmigoLabel(this.amigoId, key, amigo.labels[i]);
              }
              refresh = true;  
            }
            else if(localMap.get(key) != value) {

              // update any entry with different revision
              let amigo: AmigoEntry = await this.indexService.getAmigo(this.node, this.token, key);
              await this.storeService.updateAmigo(this.amigoId, amigo.amigoId, amigo.notes, amigo.revision);
              await this.storeService.clearAmigoLabels(this.amigoId, amigo.amigoId);
              for(let i = 0; i < amigo.labels.length; i++) {
                await this.storeService.setAmigoLabel(this.amigoId, amigo.amigoId, amigo.labels[i]);
              }
              refresh = true
            }
          });

          // remove any local entry not in remote
          await this.asyncForEach(localMap, async (value, key) => {
            if(!remoteMap.has(key)) {
              await this.storeService.removeAmigo(this.amigoId, key);
              refresh = true;
            }
          });

          // retrieve remote list of pending shares
          let remoteReq: PendingAmigoView[] = await this.indexService.getPendingRequests(this.node, this.token);
          let remoteReqMap: Map<string, number> = new Map<string, number>();
          for(let i = 0; i < remoteReq.length; i++) {
            remoteReqMap.set(remoteReq[i].shareId, remoteReq[i].revision);
          }

          // retrieve local list of pending shares
          let localReq: PendingAmigoView[] = await this.storeService.getPendingViews(this.amigoId);
          let localReqMap: Map<string, number> = new Map<string, number>();
          for(let i = 0; i < localReq.length; i++) {
            localReqMap.set(localReq[i].shareId, localReq[i].revision);
          } 

          // flag if pending amigos should refresh
          let pending: boolean = false;

          // add any new pending requests
          await this.asyncForEach(remoteReqMap, async (value, key) => {

            if(!localReqMap.has(key)) {

              // add any remote entry not local
              let amigo: PendingAmigo = await this.indexService.getPendingRequest(this.node, this.token, key);
              await this.storeService.addPending(this.amigoId, amigo);
              pending = true;
            }
            else if(localReqMap.get(key) != value) {
  
              // add any entry with different revision
              let amigo: PendingAmigo = await this.indexService.getPendingRequest(this.node, this.token, key);
              await this.storeService.updatePending(this.amigoId, key, amigo);
              pending = true; 
            }
          });

          // remove old pending requests
          this.asyncForEach(localReqMap, async (value, key) => {
            if(!remoteReqMap.has(key)) {
              await this.storeService.removePending(this.amigoId, key);
              pending = true;
            }
          });

          // refresh contacts
          if(refresh) {
            await this.refreshAmigos();
            await this.refreshContacts();
          }

          // refresh pending list
          if(pending) {
            await this.refreshPending();
          }

          // upldate group revision
          this.revision.index = r;
          await this.storeService.setAppProperty(this.amigoId, Prop.REVISION, this.revision);
        }
      }
      catch(e) {
        if(this.amigoId != null) {
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
          let local: ShareView[] = await this.storeService.getConnectionViews(this.amigoId);
          let localMap: Map<string, number> = new Map<string, number>();
          for(let i = 0; i < local.length; i++) {
            localMap.set(local[i].shareId, local[i].revision);
          }

          // add remote entry not in local
          await this.asyncForEach(remoteMap, async (value, key) => {
            if(!localMap.has(key)) {
              let entry: ShareEntry = await this.shareService.getConnection(this.node, this.token, key);
              await this.storeService.addConnection(this.amigoId, entry);
              await this.refreshContact(entry.amigoId);
              refresh = true;
            }
            else if(localMap.get(key) != value) {
              let entry: ShareEntry = await this.shareService.getConnection(this.node, this.token, key);
              await this.storeService.updateConnection(this.amigoId, entry);
              await this.refreshContact(entry.amigoId);
              refresh = true;
            }
          });

          // remove any local entry not in remote
          await this.asyncForEach(localMap, async (value, key) => {
            if(!remoteMap.has(key)) {
              await this.storeService.removeConnection(this.amigoId, key);
              refresh = true;
            }
          });
    
          // upldate group revision
          this.revision.share = r;
          await this.storeService.setAppProperty(this.amigoId, Prop.REVISION, this.revision);

          // if contacts should refresh
          if(refresh) {
            this.refreshAmigos();
            this.refreshContacts();
          }
        }
      }
      catch(e) {
        if(this.amigoId != null) {
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
          let local: LabelView[] = await this.storeService.getLabelViews(this.amigoId);
          let localMap: Map<string, number> = new Map<string, number>();
          for(let i = 0; i < local.length; i++) {
            localMap.set(local[i].labelId, local[i].revision);
          }

          // add remote entry not in local
          await this.asyncForEach(remoteMap, async (value, key) => {
            if(!localMap.has(key)) {
              let entry = await this.groupService.getLabel(this.node, this.token, key);
              await this.storeService.addLabel(this.amigoId, entry);
              refresh = true;
            }
            else if(localMap.get(key) != value) {
              let entry = await this.groupService.getLabel(this.node, this.token, key);
              await this.storeService.updateLabel(this.amigoId, entry);
              refresh = true;
            }
          });

          // remove any local entry not in remote
          await this.asyncForEach(localMap, async (value, key) => {
            if(!remoteMap.has(key)) {
              await this.storeService.removeLabel(this.amigoId, key);
              refresh = true;
            }
          });
          
          // upldate group revision
          this.revision.group = r;
          await this.storeService.setAppProperty(this.amigoId, Prop.REVISION, this.revision);

          // push labels
          if(refresh) {
            let labels: LabelEntry[] = await this.storeService.getLabels(this.amigoId);
            this.labelEntries.next(labels);
          }
        }
      }
      catch(e) {
        if(this.amigoId != null) {
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
          let amigo: Amigo = await this.identityService.getAmigo(this.node, this.token);
          this.identityAmigo.next(amigo);
          this.node = amigo.node;
          this.registry = amigo.registry;
          await this.storeService.setAppProperty(this.amigoId, Prop.IDENTITY, amigo);
          this.revision.identity = amigo.revision;
          await this.storeService.setAppProperty(this.amigoId, Prop.REVISION, this.revision);
        }
      }
      catch(e) {
        console.error(e);
      }

      try {
        if(this.registry != null) {
          let r = await this.registryService.getRevision(this.registry, this.amigoId);
          if(this.revision.identity < r) {
            let msg: AmigoMessage = await this.registryService.getMessage(this.node, this.token);
            let amigo: Amigo = getAmigoObject(msg);
            this.identityAmigo.next(amigo);
            this.node = amigo.node;
            this.registry = amigo.registry;
            await this.storeService.setAppProperty(this.amigoId, Prop.IDENTITY, amigo);
            this.revision.identity = amigo.revision;
            await this.storeService.setAppProperty(this.amigoId, Prop.REVISION, this.revision);
          }
          if(this.revision.identity > r) {
            let msg: AmigoMessage = await this.identityService.getMessage(this.node, this.token);
            let amigo: Amigo = getAmigoObject(msg);
            await this.registryService.setMessage(amigo.registry, msg);
            await this.identityService.clearDirty(this.node, this.token, amigo.revision);
          }
        }
      }
      catch(e) {
        if(this.amigoId != null) {
          console.error(e);
        }
      }
    }
  }

  private async setIdentity(msg: AmigoMessage) {

    // update with identity message
    let amigo: Amigo = getAmigoObject(msg);
    this.identityAmigo.next(amigo);
    this.node = amigo.node;
    this.registry = amigo.registry;
    await this.storeService.setAppProperty(this.amigoId, Prop.IDENTITY, amigo);
    this.revision.identity = amigo.revision;
    await this.storeService.setAppProperty(this.amigoId, Prop.REVISION, this.revision);

    // update registry
    try {
      if(amigo.registry != null) {
        await this.registryService.setMessage(this.registry, msg);
        await this.identityService.clearDirty(this.node, this.token, amigo.revision);
      }
    }
    catch(e) {
      console.log(e);
    }
  }

  public async setContact(amigoId: string) {

    this.amigo = amigoId;
    let contact: AmigoContact = await this.storeService.getContact(this.amigoId, amigoId);
    this.selectedAmigo.next(contact);
  }

  public async setAmigoLabelFilter(l: string) {
    this.amigoLabel = l;
    await this.refreshAmigos();
  }

  public async setAmigoSearchFilter(s: string) {
    this.amigoSearch = s;
    await this.refreshAmigos();
  }

  private async refreshAmigos() {
    
    try {
      // pull filtered amigos
      let filtered: AmigoContact[] = await this.storeService.getContacts(this.amigoId, this.amigoLabel, 
          this.amigoSearch, "connected", null);
      this.filteredAmigos.next(filtered);
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
      let subjects: FeedSubject[] = await this.storeService.getAmigoFeed(this.amigoId, null, 
          this.viewLabel, this.viewSearch, null);
      this.viewSubjects.next(subjects);
    }
    catch(err) {
      console.log(err);
    }
  }

  private async refreshContacts() {

    try {
      // pull unfiltered amigos
      let contacts: AmigoContact[] = await this.storeService.getContacts(this.amigoId, null, null, null, null);
      
      let contact: AmigoContact = null;
      let connected: AmigoContact[] = [];
      let saved: AmigoContact[] = [];
      let received: AmigoContact[] = [];
      let requested: AmigoContact[] = [];
      let all: AmigoContact[] = [];
      let hidden: AmigoContact[] = [];
      for(let i = 0; i < contacts.length; i++) {

        // updated selected contact
        if(this.amigo == contacts[i].amigoId) {
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
      this.selectedAmigo.next(contact);
      this.connectedAmigos.next(connected);
      this.savedAmigos.next(saved);
      this.receivedAmigos.next(received);
      this.requestedAmigos.next(requested);
      this.allAmigos.next(all);
      this.hiddenAmigos.next(hidden);
    }
    catch(e) {
      console.error(e);
    }   
  }

  private async refreshPending() {
   
    try { 
      // pull pending amigos
      let amigos: PendingContact[] = await this.storeService.getPendingContacts(this.amigoId);
      this.pendingAmigos.next(amigos);
    }
    catch(e) {
      console.error(e);
    }
  }

  public async setName(value: string) {
    let msg: AmigoMessage = await this.identityService.setName(this.node, this.token, value);
    await this.setIdentity(msg);
  }

  public async setDescription(value: string) {
    let msg: AmigoMessage = await this.identityService.setDescription(this.node, this.token, value);
    await this.setIdentity(msg);
  }

  public async setLocation(value: string) {
    let msg: AmigoMessage = await this.identityService.setLocation(this.node, this.token, value);
    await this.setIdentity(msg);
  }

  public async setImage(value: string) {
    let msg: AmigoMessage = await this.identityService.setImage(this.node, this.token, value);
    await this.setIdentity(msg);
  }

  public async checkHandle(value: string): Promise<boolean> {
    
    if(this.registry != null) {
      return this.registryService.checkHandle(this.registry, value, this.amigoId);
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
    let msg: AmigoMessage = await this.identityService.setHandle(this.node, this.token, value);
    await this.setIdentity(msg);
  }

  public async getLabels(): Promise<LabelEntry[]> {
    return await this.storeService.getLabels(this.amigoId);
  }

  public async getLabel(labelId: string): Promise<LabelEntry> {
    return await this.storeService.getLabel(this.amigoId, labelId);
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
    return await this.storeService.getAttributes(this.amigoId);
  }

  public async getAttribute(attributeId: string): Promise<AttributeEntry> {
    return await this.storeService.getAttribute(this.amigoId, attributeId);
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
    await this.storeService.addSubject(this.amigoId, entry, this.searchableSubject);
    await this.refreshShowFeed();
    return entry;
  }

  public async getSubject(subjectId: string): Promise<SubjectEntry> {
    return await this.storeService.getSubject(this.amigoId, subjectId);
  }

  public async updateSubject(subjectId: string): Promise<FeedSubjectEntry> {
  
    // refresh unversioned asset state (asset state not versioned)
    let entry: SubjectEntry = await this.showService.getSubject(this.node, this.token, subjectId);
    let stored: SubjectEntry = await this.storeService.getSubject(this.amigoId, subjectId);
    await this.storeService.updateSubject(this.amigoId, entry, this.searchableSubject);
    if(entry.subject.revision != stored.subject.revision) {
      await this.refreshShowFeed();
    }
    return await this.storeService.getFeedSubjectEntry(this.amigoId, subjectId);
  }

  public async updateSubjectData(subjectId: string, schema: string, data: string): Promise<SubjectEntry> {
  
    let entry: SubjectEntry = await this.showService.updateSubjectData(this.node, this.token, subjectId, schema, data);
    await this.storeService.updateSubject(this.amigoId, entry, this.searchableSubject);
    await this.refreshShowFeed();
    return entry;
  }

  public async updateSubjectShare(subjectId: string, share: boolean): Promise<SubjectEntry> {

    let entry: SubjectEntry = await this.showService.updateSubjectShare(this.node, this.token, subjectId, share);
    await this.storeService.updateSubject(this.amigoId, entry, this.searchableSubject);
    await this.refreshShowFeed();
    return entry;
  }

  public async updateSubjectExpire(subjectId: string, expire: number): Promise<SubjectEntry> {

    let entry: SubjectEntry = await this.showService.updateSubjectExpire(this.node, this.token, subjectId, expire);
    await this.storeService.updateSubject(this.amigoId, entry, this.searchableSubject);
    await this.refreshShowFeed();
    return entry;
  }

  public async removeSubject(subjectId: string): Promise<void> {

    await this.showService.removeSubject(this.node, this.token, subjectId);
    await this.storeService.removeSubject(this.amigoId, subjectId);
    await this.refreshShowFeed();
  }

  public async removeSubjectAsset(subjectId: string, assetId: string): Promise<void> {

    await this.showService.removeSubjectAsset(this.node, this.token, subjectId, assetId);
    await this.refreshShowFeed();
  }

  public async setSubjectLabels(subjectId: string, labelIds: string[]): Promise<SubjectEntry> {

    let entry: SubjectEntry = await this.showService.setSubjectLabels(this.node, this.token, subjectId, labelIds);
    await this.storeService.updateSubject(this.amigoId, entry, this.searchableSubject);
    await this.refreshShowFeed();
    return entry;
  }

  public async setSubjectLabel(subjectId: string, labelId: string): Promise<SubjectEntry> {

    let entry: SubjectEntry = await this.showService.setSubjectLabel(this.node, this.token, subjectId, labelId);
    await this.storeService.updateSubject(this.amigoId, entry, this.searchableSubject);
    await this.refreshShowFeed();
    return entry;
  }

  public async clearSubjectLabel(subjectId: string, labelId: string): Promise<SubjectEntry> {

    let entry: SubjectEntry = await this.showService.clearSubjectLabel(this.node, this.token, subjectId, labelId);
    await this.storeService.updateSubject(this.amigoId, entry, this.searchableSubject);
    await this.refreshShowFeed();
    return entry;
  }

  public async getSubjectTags(subjectId: string): Promise<Tag[]> {
    return await this.storeService.getSubjectTags(this.amigoId, subjectId);
  }

  public async getAmigoSubjectTags(amigoId: string, subjectId: string): Promise<Tag[]> {
    return await this.storeService.getAmigoSubjectTags(this.amigoId, amigoId, subjectId);
  }

  public async addSubjectTag(subjectId: string, data: string): Promise<Tag[]> {
    let t = await this.showService.addSubjectTag(this.node, this.token, subjectId, this.tagFilter, data);
    await this.storeService.updateSubjectTags(this.amigoId, subjectId, t.revision, t.tags);
    await this.refreshShowFeed();
    return t.tags;
  }

  public async addAmigoSubjectTag(amigoId: string, subjectId: string, data: string): Promise<Tag[]> {
    let update: AmigoUpdate = await this.storeService.getAmigoUpdate(this.amigoId, amigoId);
    let t = await this.viewService.addSubjectTags(this.serviceNode, this.serviceToken, update.node, update.token,
        subjectId, this.tagFilter, data);
    await this.storeService.updateAmigoSubjectTags(this.amigoId, amigoId, subjectId, t.revision, t.tags);
    await this.refreshViewFeed();
    return t.tags;
  }

  public async removeSubjectTag(subjectId: string, tagId: string): Promise<Tag[]> {
    let t = await this.showService.removeSubjectTag(this.node, this.token, subjectId, tagId, this.tagFilter);
    await this.storeService.updateSubjectTags(this.amigoId, subjectId, t.revision, t.tags);
    await this.refreshShowFeed();
    return t.tags;
  }

  public async removeAmigoSubjectTag(amigoId: string, subjectId: string, tagId: string): Promise<Tag[]> {
    let update: AmigoUpdate = await this.storeService.getAmigoUpdate(this.amigoId, amigoId);
    let t = await this.viewService.removeSubjectTags(this.serviceNode, this.serviceToken, update.node, update.token,
        subjectId, tagId, this.tagFilter);
    await this.storeService.updateAmigoSubjectTags(this.amigoId, amigoId, subjectId, t.revision, t.tags);
    await this.refreshViewFeed();
    return t.tags;
  }

  public getUploadUrl(subjectId: string, transforms: string[]): string {
    return this.showService.getUploadUrl(this.node, this.token, subjectId, transforms);
  }

  public getLogoUrl(revision: number): string {
    return this.identityService.getImageUrl(this.node, this.token, revision);
  } 

  public getAmigoLogoUrl(amigoId: string, revision: number): string {
    return this.indexService.getAmigoLogoUrl(this.node, this.token, amigoId, revision);
  }

  public getShowAssetUrl(subjectId: string, assetId: string): string {
    return this.showService.getAssetUrl(this.node, this.token, subjectId, assetId);
  }

  public async getViewAssetUrl(amigoId: string, subjectId: string, assetId: string): Promise<string> {

    let update: AmigoUpdate = await this.storeService.getAmigoUpdate(this.amigoId, amigoId);
    return await this.viewService.getAssetUrl(this.serviceNode, this.serviceToken, update.node, update.token, 
        subjectId, assetId);
  }

  public async addConnection(amigo: string): Promise<ShareEntry> {
    
    let share: ShareEntry = await this.shareService.addConnection(this.node, this.token, amigo);
    await this.syncShare();
    return share;
  }

  public async openConnection(amigo: string, share: string, node: string): Promise<string> {

    let entry: ShareEntry = await this.shareService.updateStatus(this.node, this.token, share, "requesting", null);
    await this.syncShare();

    let msg: ShareMessage = await this.shareService.getMessage(this.node, this.token, share);
    let status: ShareStatus = await this.shareService.setMessage(node, amigo, msg);
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

  public async closeConnection(amigo: string, share: string, node: string): Promise<string> {

    let entry: ShareEntry = await this.shareService.updateStatus(this.node, this.token, share, "closing", null);
  
    try {
      let msg: ShareMessage = await this.shareService.getMessage(this.node, this.token, share);
      let status: ShareStatus = await this.shareService.setMessage(node, amigo, msg);
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

  public async removeConnection(amigo: string, share: string) {

    await this.shareService.removeConnection(this.node, this.token, share);
    await this.syncShare();
  }

  public async getAmigo(amigoId: string): Promise<AmigoEntry> {
    return await this.storeService.getAmigo(this.amigoId, amigoId);
  }

  public async addAmigo(msg: AmigoMessage): Promise<AmigoEntry> {

    let entry: AmigoEntry = await this.indexService.addAmigo(this.node, this.token, msg);
    await this.syncIndex();
    await this.syncShare();
    let update = await this.storeService.getAmigoUpdate(this.amigoId, entry.amigoId);
    await this.syncAmigoIdentity(update);
    return entry;
  }

  public async updateAmigoNotes(amigoId: string, notes: string): Promise<AmigoEntry> {
    
    let entry: AmigoEntry = await this.indexService.setAmigoNotes(this.node, this.token, amigoId, notes);
    await this.syncIndex();
    return entry;
  }

  public async removeAmigo(amigoId: string) {

    await this.indexService.removeAmigo(this.node, this.token, amigoId);
    await this.syncIndex();
  }

  public async setAmigoLabels(amigoId: string, labelIds: string[]): Promise<AmigoEntry> {

    let view: AmigoEntry = await this.indexService.setAmigoLabels(this.node, this.token, amigoId, labelIds);
    await this.syncIndex();
    return view;
  }

  public async setAmigoLabel(amigoId: string, labelId: string): Promise<AmigoEntry> {

    let view: AmigoEntry = await this.indexService.setAmigoLabel(this.node, this.token, amigoId, labelId);
    await this.syncIndex();
    return view;
  }

  public async clearAmigoLabel(amigoId: string, labelId: string): Promise<AmigoEntry> {

    let view: AmigoEntry = await this.indexService.clearAmigoLabel(this.node, this.token, amigoId, labelId);
    await this.syncIndex();
    return view;
  }

  public async getPending(shareId: string): Promise<PendingAmigo> {
    return await this.storeService.getPending(this.amigoId, shareId);
  }

  public async clearAmigoRequest(shareId: string) {

    await this.indexService.clearRequest(this.node, this.token, shareId);
    await this.syncIndex();
  }

  public async setContactShareData(share: string, obj: any): Promise<void> {
    await this.storeService.setShareData(this.amigoId, share, obj);
    this.refreshAmigos();
  }

  public async setPendingAmigoData(share: string, obj: any): Promise<void> {
    await this.storeService.setPendingData(this.amigoId, share, obj);
  }

  public async setAmigoFeed(amigo: string, hidden: boolean) {
    await this.storeService.setAmigoFeed(this.amigoId, amigo, hidden);
    this.refreshContacts();
    this.refreshViewFeed();
  }

  public async setContactIdentityData(amigo: string, obj: any): Promise<void> {
    await this.storeService.setAmigoIdentityData(this.amigoId, amigo, obj);
    this.refreshAmigos();
  }

  public async getContactIdentity(amigo: string): Promise<Amigo> {
    return await this.storeService.getAmigoIdentity(this.amigoId, amigo);
  }

  public async getContactShare(amigo: string): Promise<ShareEntry> {
    return await this.storeService.getAmigoShare(this.amigoId, amigo);
  }

  public async setContactProfileData(amigo: string, obj: any): Promise<void> {
    await this.storeService.setAmigoAttributeData(this.amigoId, amigo, obj);
    this.refreshAmigos();
  }

  public async getContactProfile(amigo: string): Promise<Attribute[]> {
    return await this.storeService.getAmigoAttributes(this.amigoId, amigo);
  }

  public async setViewSubjectFeed(amigo: string, subject: string, hidden: boolean) {
    await this.storeService.setViewSubjectFeed(this.amigoId, amigo, subject, hidden);
    this.refreshViewFeed();
  }

  public async getShowFeedSubject(subjectId: string): Promise<FeedSubjectEntry> {
    return await this.storeService.getFeedSubjectEntry(this.amigoId, subjectId);
  }

  public async getContact(amigoId: string): Promise<AmigoContact> {
    return await this.storeService.getContact(this.amigoId, amigoId);
  }
  
  public async getContacts(label: string, search: string, status: string, hidden: boolean): Promise<AmigoContact[]> {
    return await this.storeService.getContacts(this.amigoId, label, search, status, hidden);
  }

  public async getShowFeed(label: string, search: string, limit: number): Promise<FeedSubjectEntry[]> {
    return await this.storeService.getSubjectFeed(this.amigoId, label, search, limit);
  }

  public async getViewFeed(amigo: string, label:string, search: string, limit: number): Promise<FeedSubject[]> {
    return await this.storeService.getAmigoFeed(this.amigoId, amigo, label, search, limit);
  }

  public async getHiddenFeed(label: string, search: string, limit: number): Promise<FeedSubject[]> {
    return await this.storeService.getHiddenFeed(this.amigoId, label, search, limit);
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
      let updates: AmigoUpdate[] = await this.storeService.getStaleAmigos(this.amigoId, cur - this.stale);

      for(let i = 0; i < updates.length; i++) {

        // set updated timestamp
        await this.storeService.setAmigoUpdateTimestamp(this.amigoId, updates[i].amigoId, cur);
 
        // update identity
        await this.syncAmigoIdentity(updates[i]);

        // update attributes
        await this.syncAmigoAttributes(updates[i]);

        // update subjects
        await this.syncAmigoSubjects(updates[i]);

      }
    }
    catch(e) {
      if(this.amigoId != null) {
        console.error(e);
      }
    }
    console.log("sync changes: done");
  }

  public async refreshContact(amigo: string) {

    // update profile of specified contact
    let d: Date = new Date();
    let cur: number = Math.floor(d.getTime() / 1000);
    try {
      let update: AmigoUpdate = await this.storeService.getAmigoUpdate(this.amigoId, amigo);
      await this.storeService.setAmigoUpdateTimestamp(this.amigoId, update.amigoId, cur);
      await this.syncAmigoIdentity(update);
      await this.syncAmigoAttributes(update);
      await this.syncAmigoSubjects(update);
    }
    catch(err) {
      console.log(err);
    }
  }

  public async refreshAllContacts() {
  
    // retrieve any stale contact
    let d: Date = new Date();
    let cur: number = Math.floor(d.getTime() / 1000);
    let updates: AmigoUpdate[] = await this.storeService.getStaleAmigos(this.amigoId, cur);

    // sync each view
    for(let i = 0; i < updates.length; i++) {

      try {

        // set updated timestamp
        await this.storeService.setAmigoUpdateTimestamp(this.amigoId, updates[i].amigoId, cur);

        // update identity
        await this.syncAmigoIdentity(updates[i]);

        // update attributes
        await this.syncAmigoAttributes(updates[i]);

        // update subjects
        await this.syncAmigoSubjects(updates[i]);
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





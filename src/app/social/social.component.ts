import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from "@angular/core";
import { Subscription } from 'rxjs';
import { Page } from "tns-core-modules/ui/page";
import { RouterExtensions } from "@nativescript/angular";
import { StackLayout } from "tns-core-modules/ui/layouts/stack-layout"
import { Image } from "tns-core-modules/ui/image";

import { knownFolders, path, File, Folder } from "tns-core-modules/file-system";
import { Mediafilepicker, ImagePickerOptions, VideoPickerOptions, AudioPickerOptions, FilePickerOptions } from 'nativescript-mediafilepicker';

import * as  base64 from "base-64";
import * as utf8 from "utf8";

import { EmigoService } from '../lib/emigo.service';
import { AccessService } from '../lib/access.service';
import { RegistryService } from '../lib/registry.service';
import { IdentityService } from '../lib/identity.service';
import { ShareService } from '../lib/share.service';
import { IndexService } from '../lib/index.service';
import { ContactService } from '../lib/contact.service';
import { GroupService } from '../lib/group.service';
import { ProfileService } from '../lib/profile.service';
import { ViewService } from '../lib/view.service';

import { FeedSubject } from '../lib/feedSubject';
import { FeedSubjectEntry } from '../lib/feedSubjectEntry';

import { ShareEntry } from '../lib/shareEntry';
import { ShareStatus } from '../lib/shareStatus';
import { ShareMessage } from '../lib/shareMessage';
import { SubjectView } from '../lib/subjectView';
import { SubjectEntry } from '../lib/subjectEntry';
import { Emigo } from '../lib/emigo';
import { Asset } from '../lib/asset';
import { Attribute } from '../lib/attribute';
import { LabelEntry } from '../lib/labelEntry';
import { ServiceAccess } from '../lib/serviceAccess';
import { getEmigoObject } from '../lib/emigo.util';
import { AttributeView } from '../lib/attributeView';
import { EmigoMessage } from '../lib/emigoMessage';
import { EmigoEntry } from '../lib/emigoEntry';
import { PendingEmigo } from '../lib/pendingEmigo';
import { PendingEmigoView } from '../lib/pendingEmigoView';
import { Subject } from '../lib/subject';

class User {
  emigoId: string;
  accountNode: string;
  accountToken: string;
  registry: string;
  appNode: string;
  appToken: string;
}

var bghttp = require("nativescript-background-http");
var httpSession = bghttp.session("uploader");

@Component({
    selector: "social",
    moduleId: module.id,
    templateUrl: "./social.component.xml"
})
export class SocialComponent implements OnInit, OnDestroy {

  public node: string = "https://db000024.dbcluster.org:8443/ssi";
  public token: string = "ijropuI2anDckicJeB3Bc09pTcHWem1u";
  public registry: string = "https://registry.dev.coredb.org:8443/app";

  private act: User = null;
  private contact: User[] = [];
  private labelId: string = null;
  private subjectId: string = null;
  private assetId: string = null;
  private httpSession: any;
  @ViewChild("res", {static: false}) icon: ElementRef;

  constructor(private routerExtensions: RouterExtensions,
      private accessService: AccessService,
      private registryService: RegistryService,
      private identityService: IdentityService,
      private shareService: ShareService,
      private indexService: IndexService,
      private contactService: ContactService,
      private groupService: GroupService,
      private profileService: ProfileService,
      private viewService: ViewService,
      private emigoService: EmigoService) {
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
  }

  timeout(s: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, s * 1000));
  }

  onNode(t: string) {
    this.node = t;
  }

  onToken(t: string) {
    this.token = t;
  }

  async onTest() {

    let options: ImagePickerOptions = {
      android: {
        isCaptureMood: false, // if true then camera will open directly.
        isNeedCamera: true,
        maxNumberFiles: 10,
        isNeedFolderList: true
      }, ios: {
        isCaptureMood: false, // if true then camera will open directly.
        isNeedCamera: true,
        maxNumberFiles: 10
      }
    };

    let mediafile: any = new Mediafilepicker();
    mediafile.openImagePicker(options);
    mediafile.on("getFiles", async sel => {

      this.emigoService.clearEmigo();
      this.contactService.clearAuth();
      this.viewService.clearAuth();      

      let files = sel.object.get('results');
      if(files.length == 1) {
        await this.runTest(files[0].file);
      }
      else {
        console.log(files.length);
        console.log("select only one file");
      }

      this.contactService.clearAuth();      
      this.viewService.clearAuth();      
      this.emigoService.clearEmigo();
    });
  }

  async runTest(file) {

    console.log("CONNECT: " + this.node + " - " + this.token);

    // create accounts
    try {
      console.log("creating accounts");
      this.act = await this.createAccount();
      this.contact = [];
      this.contact.push(await this.createAccount());
      this.contact.push(await this.createAccount());
      console.log("creating accounts: done");
    }
    catch(e) {
      console.error("creating accounts: failed");
      console.error(e);
      return;
    }

    console.log("ACCOUNT: " + this.act.emigoId);
    console.log("CONTACT0: " + this.contact[0].emigoId);
    console.log("CONTACT1: " + this.contact[1].emigoId);

    // load account
    try {
      console.log("setting account");
      let c = await this.emigoService.init("test007.db");
      await this.emigoService.setAppContext({ "emigoId": this.act.emigoId, "registry": this.act.registry,
          "token": this.act.accountToken, "serviceNode": this.act.appNode, "serviceToken": this.act.appToken });
      let a = await this.emigoService.setEmigo(this.act.emigoId, this.act.registry, this.act.accountToken,
          this.act.appNode, this.act.appToken, [ "0101" ], [ "2020" ], null, e => { }, s => { }, 5, 2);
      console.log(a);
      console.log("setting account: done");
    }
    catch(e) {
      console.error("setting account: failed");
      console.error(e);
      return;
    }

    // add label
    try {
      console.log("set labels");
      let l: LabelEntry = await this.emigoService.addLabel("bff");
      this.labelId = l.labelId;
      console.log("set labels: done");
    }
    catch(e) {
      console.error("set labels: failed");
      console.error(e);
      return;
    }

    // add subject
    try {
      console.log("set subject");
      let s: SubjectEntry;
      let v: SubjectView;
      s = await this.emigoService.addSubject("2020");
      this.subjectId = s.subject.subjectId;
      let u = await this.emigoService.setSubjectLabel(this.subjectId, this.labelId);
      let e: FeedSubjectEntry = await this.emigoService.updateSubject(this.subjectId);
      console.log(e);

      let upload: string = this.emigoService.getUploadUrl(this.subjectId, [ "P01", "P06" ]);
      console.log("UPLOAD: " + upload);

      var request = { url: upload, method: "POST", headers: { "Content-Type": "multipart/form-data" }, description: "." };
      var params = [{name:"file", filename: file, mimeType: 'application/octet-stream'}];
      var task = httpSession.multipartUpload(params, request);

      task.on("responded", async r => { 
        let a: Asset = JSON.parse(r.data);
        for(let i = 0; i < a.assets.length; i++) {
          if(a.assets[i].transform == "P06") {
            this.assetId = a.assets[i].assetId;
          }
        }
        await this.emigoService.updateSubjectData(this.subjectId, "2020", this.assetId);
        let entry: SubjectEntry = await this.emigoService.updateSubjectShare(this.subjectId, true);
        console.log(entry);
      });

      // wait for subject to be ready
      while(true) {
        let subject: FeedSubjectEntry = await this.emigoService.updateSubject(this.subjectId);
        if(subject.ready && subject.share) {
          console.log("READY: ", subject);
          break;
        }
        await this.timeout(2);
      }

      // get asset url
      let url: string = this.emigoService.getShowAssetUrl(this.subjectId, this.assetId);
      let stack = <StackLayout>this.icon.nativeElement;
      let img: Image = new Image;
      img.src = url;
      img.width = 128;
      img.height = 128;
      stack.addChild(img);
    }
    catch(e) {
      console.log("set subject failed");
      console.error(e);
      return;
    }

    // request connection
    try {
      console.log("requesting connection");
      let msg: EmigoMessage = await this.registryService.getMessage(this.contact[0].registry, this.contact[0].emigoId);
      let emigo: EmigoEntry = await this.emigoService.addEmigo(msg);
      await this.emigoService.setEmigoLabel(emigo.emigoId, this.labelId);
      let share: ShareEntry = await this.emigoService.addConnection(this.contact[0].emigoId);
      let status: string = await this.emigoService.openConnection(this.contact[0].emigoId, share.shareId, this.node);

      let tok: string = this.contact[0].accountToken;
      let pending: PendingEmigoView[] = await this.indexService.getPendingRequests(this.node, tok);
      let request: PendingEmigo = await this.indexService.getPendingRequest(this.node, tok, pending[0].shareId);
      let entry: EmigoEntry = await this.indexService.addEmigo(this.node, tok, request.message);
      let connection: ShareEntry = await this.shareService.addConnection(this.node, tok, entry.emigoId);
      await this.shareService.updateStatus(this.node, tok, connection.shareId, "requesting", null);
      let message: ShareMessage = await this.shareService.getMessage(this.node, tok, connection.shareId);
      let issue: ShareStatus = await this.shareService.setMessage(this.node, this.act.emigoId, message);
      await this.shareService.updateStatus(this.node, tok, connection.shareId, "connected", issue.connected);
    }
    catch(e) {
      console.log("requesting connection failed");
      console.error(e);
      return;
    }
 
    // request connection
    try {
      console.log("requesting connection");
      let msg: EmigoMessage = await this.registryService.getMessage(this.contact[1].registry, this.contact[1].emigoId);
      let emigo: EmigoEntry = await this.emigoService.addEmigo(msg);
      let share: ShareEntry = await this.emigoService.addConnection(this.contact[1].emigoId);
      let status: string = await this.emigoService.openConnection(this.contact[1].emigoId, share.shareId, this.node);

      let tok: string = this.contact[1].accountToken;
      let pending: PendingEmigoView[] = await this.indexService.getPendingRequests(this.node, tok);
      let request: PendingEmigo = await this.indexService.getPendingRequest(this.node, tok, pending[0].shareId);
      let entry: EmigoEntry = await this.indexService.addEmigo(this.node, tok, request.message);
      let connection: ShareEntry = await this.shareService.addConnection(this.node, tok, entry.emigoId);
      await this.shareService.updateStatus(this.node, tok, connection.shareId, "requesting", null);
      let message: ShareMessage = await this.shareService.getMessage(this.node, tok, connection.shareId);
      let issue: ShareStatus = await this.shareService.setMessage(this.node, this.act.emigoId, message);
      await this.shareService.updateStatus(this.node, tok, connection.shareId, "connected", issue.connected);
    }
    catch(e) {
      console.log("requesting connection failed");
      console.error(e);
      return;
    }

    // reset services
    this.emigoService.clearEmigo();
    this.contactService.clearAuth();
    this.viewService.clearAuth();

    // check shared subjects 
    try {
      console.log("shared feed");
      let user: User = this.contact[0];
      let share: ShareEntry[] = await this.shareService.getConnections(user.accountNode, user.accountToken);
      if(share.length != 1) {
        throw new Error("contact not connected");
      }
      let feed: Subject[] = await this.viewService.getSubjects(user.appNode, user.appToken,
          this.act.accountNode, share[0].token, [ "2020" ]);
      console.log(feed);
    }
    catch(e) {
      console.log("shared feed failed");
      console.error(e);
      return;
    }
    
    // reset services
    this.emigoService.clearEmigo();
    this.contactService.clearAuth();
    this.viewService.clearAuth();

    // load contact account
    try {
      console.log("setting contact");
      let user: User = this.contact[0];

      let a = await this.emigoService.setEmigo(user.emigoId, user.registry, user.accountToken,
          user.appNode, user.appToken, [ "0101" ], [ "2020" ], null, e => {}, s => {}, 5, 2);
      
      for(let i = 0; i < 10; i++) {
        await this.timeout(1);
        let subjects: FeedSubject[] = await this.emigoService.getViewFeed(null, null, null, 4);
        if(subjects.length == 1) {
          break;
        }
      }
      let subs: FeedSubject[] = await this.emigoService.getViewFeed(null, null, null, 4);
      if(subs.length != 1) {
        throw new Error("feed is empty");
      }


      // get asset url
      let url: string = await this.emigoService.getViewAssetUrl(subs[0].emigoId, subs[0].subjectId, subs[0].data);
      let stack = <StackLayout>this.icon.nativeElement;
      let img: Image = new Image;
      img.src = url;
      img.width = 128;
      img.height = 128;
      stack.addChild(img);
      console.log("setting contact: done");
    }
    catch(e) {
      console.error("setting account: failed");
      console.error(e);
      return;
    }
 
    // reset services
    this.emigoService.clearEmigo();
    this.contactService.clearAuth();
    this.viewService.clearAuth();

    // load contact account
    try {
      console.log("lonely contact");
      let user: User = this.contact[1];

      let a = await this.emigoService.setEmigo(user.emigoId, user.registry, user.accountToken,
          user.appNode, user.appToken, [ "0101" ], [ "2020" ], null, e => {}, s => {}, 5, 2);

      for(let i = 0; i < 10; i++) {
        await this.timeout(1);
        let subjects: FeedSubject[] = await this.emigoService.getViewFeed(null, null, null, 4);
        if(subjects.length != 0) {
          throw new Error("feed was not empty and should be");
        }
      }
    }
    catch(e) {
      console.error("lonely contact failed");
      console.error(e);
      return;
    }

    console.log("SUCCESS!");
  }


  private async createAccount(): Promise<User> {
    let access: ServiceAccess = { "enableIdentity": true, "enableProfile": true, "enableShow": true,
        "enableGroup": true, "enableShare": true, "enableIndex": true };

    let app = await this.accessService.createAccount(this.node, this.token);
    let token: any = JSON.parse(utf8.decode(base64.decode(app.token)));
    let msg = await this.accessService.authorizeAccount(this.node, token.token, access);
    let emigo = await this.accessService.createUser(this.node, this.token, msg);
    let usr = await this.accessService.assignUser(this.node, token.token, emigo)
    let m = await this.identityService.setRegistry(this.node, usr.accountToken, this.registry);
    await this.registryService.setMessage(this.registry, m);

    return { "emigoId": usr.emigoId, "accountNode": this.node, "accountToken": usr.accountToken, "registry": this.registry,
        "appNode": this.node, "appToken": usr.serviceToken };
  }

}


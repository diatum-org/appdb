import { Component, OnInit, OnDestroy } from "@angular/core";
import { Subscription } from 'rxjs'; 
import { Page } from "tns-core-modules/ui/page";
import { RouterExtensions } from "@nativescript/angular";

import * as  base64 from "base-64";
import * as utf8 from "utf8";

import { AmigoService } from '../lib/amigo.service';
import { AccessService } from '../lib/access.service';
import { RegistryService } from '../lib/registry.service';
import { IdentityService } from '../lib/identity.service';
import { ShareService } from '../lib/share.service';
import { IndexService } from '../lib/index.service';
import { ContactService } from '../lib/contact.service';
import { GroupService } from '../lib/group.service';
import { ProfileService } from '../lib/profile.service';
import { ViewService } from '../lib/view.service';

import { ShareEntry } from '../lib/shareEntry';
import { ShareStatus } from '../lib/shareStatus';
import { ShareMessage } from '../lib/shareMessage';

import { Amigo } from '../lib/amigo';
import { Attribute } from '../lib/attribute';
import { AttributeEntry } from '../lib/attributeEntry';
import { LabelEntry } from '../lib/labelEntry';
import { ServiceAccess } from '../lib/serviceAccess';
import { getAmigoObject } from '../lib/amigo.util';
import { AttributeView } from '../lib/attributeView';
import { AmigoMessage } from '../lib/amigoMessage';
import { AmigoEntry } from '../lib/amigoEntry';
import { PendingAmigo } from '../lib/pendingAmigo';
import { PendingContact } from '../lib/pendingContact';
import { PendingAmigoView } from '../lib/pendingAmigoView';

class User {
  amigoId: string;
  accountNode: string;
  accountToken: string;
  registry: string;
  appNode: string;
  appToken: string;
}

@Component({
    selector: "contact",
    moduleId: module.id,
    templateUrl: "./contact.component.xml"
})
export class ContactComponent implements OnInit, OnDestroy {

  public node: string = "https://db000024.dbcluster.org:8443/ssi";
  public token: string = "ijropuI2anDckicJeB3Bc09pTcHWem1u";
  public registry: string = "https://registry.dev.coredb.org:8443/app";

  private act: User = null;
  private contact: User[] = [];
  private labelId: string = null;
  private attributeId: string = null;

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
      private amigoService: AmigoService) {
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

    this.amigoService.clearAmigo();
    this.contactService.clearAuth();
    this.viewService.clearAuth();
    
    await this.runTest();
    
    this.amigoService.clearAmigo();
    this.contactService.clearAuth();
    this.viewService.clearAuth();
  }

  async runTest() {

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

    console.log("ACCOUNT: " + this.act.amigoId);
    console.log("CONTACT0: " + this.contact[0].amigoId);
    console.log("CONTACT1: " + this.contact[1].amigoId);
  
    // load account
    try {
      console.log("setting account");
      let c = await this.amigoService.init("test007.db");
      await this.amigoService.setAppContext({ "amigoId": this.act.amigoId, "registry": this.act.registry, 
          "token": this.act.accountToken, "serviceNode": this.act.appNode, "serviceToken": this.act.appToken });
      let a = await this.amigoService.setAmigo(this.act.amigoId, this.act.registry, this.act.accountToken, 
          this.act.appNode, this.act.appToken, [ "0101" ], [ "2020" ], null, e => {}, s => {}, 5, 2);
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
      let l: LabelEntry = await this.amigoService.addLabel("bff");
      this.labelId = l.labelId;
      console.log("set labels: done"); 
    }
    catch(e) {
      console.error("set labels: failed");
      console.error(e);
      return;
    }

    // add attribute
    try {
      console.log("set attribute");
      let a: AttributeEntry;
      let v: AttributeView;
      a = await this.amigoService.addAttribute("0101", "data1");
      this.attributeId = a.attribute.attributeId;
      await this.amigoService.addAttribute("0101", "data2");
      await this.amigoService.addAttribute("0101", "data3");
      console.log(a);
      console.log("set label:");
      a = await this.amigoService.setAttributeLabel(this.attributeId, this.labelId);
      console.log(a);
    }
    catch(e) {
      console.log("set attribute failed");
      console.error(e);
      return;
    }

    // request connection
    try {
      console.log("requesting connection");
      let msg: AmigoMessage = await this.registryService.getMessage(this.contact[0].registry, this.contact[0].amigoId);
      let amigo: AmigoEntry = await this.amigoService.addAmigo(msg);
      let share: ShareEntry = await this.amigoService.addConnection(this.contact[0].amigoId);
      let status: string = await this.amigoService.openConnection(this.contact[0].amigoId, share.shareId, this.node);

      let tok: string = this.contact[0].accountToken;
      let pending: PendingAmigoView[] = await this.indexService.getPendingRequests(this.node, tok);

      let request: PendingAmigo = await this.indexService.getPendingRequest(this.node, tok, pending[0].shareId);
      let entry: AmigoEntry = await this.indexService.addAmigo(this.node, tok, request.message);
      let connection: ShareEntry = await this.shareService.addConnection(this.node, tok, entry.amigoId);
      await this.shareService.updateStatus(this.node, tok, connection.shareId, "requesting", null);
      let message: ShareMessage = await this.shareService.getMessage(this.node, tok, connection.shareId);
      let issue: ShareStatus = await this.shareService.setMessage(this.node, this.act.amigoId, message);
      await this.shareService.updateStatus(this.node, tok, connection.shareId, "connected", issue.connected);
      let label: LabelEntry = await this.groupService.addLabel(this.node, tok, "LABLER");
      let bad: AttributeEntry = await this.profileService.addAttribute(this.node, tok, "1010", "bad stuff");
      await this.profileService.setAttributeLabel(this.node, tok, bad.attribute.attributeId, label.labelId);
      await this.indexService.setAmigoLabel(this.node, tok, entry.amigoId, label.labelId);
      let good: AttributeEntry = await this.profileService.addAttribute(this.node, tok, "0101", "good stuff");
      await this.profileService.setAttributeLabel(this.node, tok, good.attribute.attributeId, label.labelId);
      await this.indexService.setAmigoLabel(this.node, tok, entry.amigoId, label.labelId);

      // should have profile within 10 seconds
      let profile: Attribute[];
      for(let i = 0; i < 5; i++) {
        await this.timeout(2);
        profile = await this.amigoService.getContactProfile(amigo.amigoId);
        if(profile.length == 1) {
          break;
        }
      }
      if(profile.length != 1 || profile[0].data != "good stuff") {
        throw new Error("invalid profile");
      } 
    }
    catch(e) {
      console.log("requesting connection failed");
      console.error(e);
      return;
    }

    // accept connection
    try {
      console.log("accepting connection");
      let tok: string = this.contact[1].accountToken;
      let msg: AmigoMessage = await this.registryService.getMessage(this.act.registry, this.act.amigoId);
      let entry: AmigoEntry = await this.indexService.addAmigo(this.node, tok, msg);
      let connection: ShareEntry = await this.shareService.addConnection(this.node, tok, entry.amigoId);
      await this.shareService.updateStatus(this.node, tok, connection.shareId, "requesting", null);
      let message: ShareMessage = await this.shareService.getMessage(this.node, tok, connection.shareId);
      let issue: ShareStatus = await this.shareService.setMessage(this.node, this.act.amigoId, message);

      let contacts: PendingContact[] = [];
      this.amigoService.pendingContacts.subscribe(e => {
        contacts = e;    
      });
      for(let i = 0; i < 5; i++) {
        await this.timeout(2);
        if(contacts.length == 1) {
          break;
        }
      }
      if(contacts.length != 1) {
        throw new Error("invalid contacts amigos");
      }
      let pending: PendingAmigo = await this.amigoService.getPending(contacts[0].shareId);
      let amigo: AmigoEntry = await this.amigoService.addAmigo(pending.message);
      let share: ShareEntry = await this.amigoService.addConnection(amigo.amigoId);
      let status: string = await this.amigoService.openConnection(amigo.amigoId, share.shareId, this.node);

      let label: LabelEntry = await this.groupService.addLabel(this.node, tok, "LABLER");
      let bad: AttributeEntry = await this.profileService.addAttribute(this.node, tok, "1010", "bad stuff2");
      await this.profileService.setAttributeLabel(this.node, tok, bad.attribute.attributeId, label.labelId);
      await this.indexService.setAmigoLabel(this.node, tok, entry.amigoId, label.labelId);
      let good: AttributeEntry = await this.profileService.addAttribute(this.node, tok, "0101", "good stuff2");
      await this.profileService.setAttributeLabel(this.node, tok, good.attribute.attributeId, label.labelId);
      await this.indexService.setAmigoLabel(this.node, tok, entry.amigoId, label.labelId);

      // should have profile within 10 seconds
      let profile: Attribute[];
      for(let i = 0; i < 5; i++) {
        await this.timeout(2);
        profile = await this.amigoService.getContactProfile(amigo.amigoId);
        if(profile.length == 1) {
          break;
        }
      }

      if(profile.length != 1 || profile[0].data != "good stuff2") {
        throw new Error("invalid profile");
      } 
    }
    catch(e) {
      console.log("accepting connection failed");
      console.error(e);
      return;
    }
    
    // share double labeled attribute with 0 but not 1
    try {
      console.log("sharing profile");
      let label: LabelEntry = await this.amigoService.addLabel("friend");
      let attr: AttributeEntry = await this.amigoService.addAttribute("0101", "coffee");
      await this.amigoService.setAttributeLabel(attr.attribute.attributeId, label.labelId);
      await this.amigoService.setAttributeLabel(attr.attribute.attributeId, this.labelId);
      await this.amigoService.setAmigoLabel(this.contact[0].amigoId, label.labelId);
      await this.amigoService.setAmigoLabel(this.contact[0].amigoId, this.labelId);
    }
    catch(e) {
      console.log("sharing profile failed");
      console.error(e);
      return;
    }

    // reset services
    this.amigoService.clearAmigo();

    // check shared attributes
    try {
      this.contactService.clearAuth();
      console.log("shared profile");
      let user: User = this.contact[0];
      let share: ShareEntry[] = await this.shareService.getConnections(user.accountNode, user.accountToken);
      if(share.length != 1) {
        throw new Error("contact not connected");
      }
      let attr: Attribute[] = await this.contactService.getAttributes(user.appNode, user.appToken, 
          this.act.accountNode, share[0].token, [ "0101" ]);
      if(attr.length != 2) {
        throw new Error("invalid shared attributes");
      }
    }
    catch(e) {
      console.log("sharing profile failed");
      console.error(e);
      return;
    }

    // check unshared attributes
    try {
      this.contactService.clearAuth();
      console.log("hidden profile");
      let user: User = this.contact[1];
      let share: ShareEntry[] = await this.shareService.getConnections(user.accountNode, user.accountToken);
      if(share.length != 1) {
        throw new Error("contact not connected");
      }
      let attr: Attribute[] = await this.contactService.getAttributes(user.appNode, user.appToken,
          this.act.accountNode, share[0].token, [ "0101" ]);
      if(attr.length != 0) {
        throw new Error("invalid shared attributes");
      }
    }
    catch(e) {
      console.log("hidden profile failed");
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
    let amigo = await this.accessService.createUser(this.node, this.token, msg);
    let usr = await this.accessService.assignUser(this.node, token.token, amigo)
    let m = await this.identityService.setRegistry(this.node, usr.accountToken, this.registry);
    await this.registryService.setMessage(this.registry, m);

    return { "amigoId": usr.amigoId, "accountNode": this.node, "accountToken": usr.accountToken, "registry": this.registry,
        "appNode": this.node, "appToken": usr.serviceToken };
  }

}

import { Component, OnInit, OnDestroy } from "@angular/core";
import { Subscription } from 'rxjs'; 
import { Page } from "tns-core-modules/ui/page";
import { RouterExtensions } from "@nativescript/angular";

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

import { ShareEntry } from '../lib/shareEntry';
import { ShareStatus } from '../lib/shareStatus';
import { ShareMessage } from '../lib/shareMessage';

import { Emigo } from '../lib/emigo';
import { Attribute } from '../lib/attribute';
import { AttributeEntry } from '../lib/attributeEntry';
import { LabelEntry } from '../lib/labelEntry';
import { ServiceAccess } from '../lib/serviceAccess';
import { getEmigoObject } from '../lib/emigo.util';
import { AttributeView } from '../lib/attributeView';
import { EmigoMessage } from '../lib/emigoMessage';
import { EmigoEntry } from '../lib/emigoEntry';
import { PendingEmigo } from '../lib/pendingEmigo';
import { PendingContact } from '../lib/pendingContact';
import { PendingEmigoView } from '../lib/pendingEmigoView';

class User {
  emigoId: string;
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

    this.emigoService.clearEmigo();
    this.contactService.clearAuth();
    this.viewService.clearAuth();
    
    await this.runTest();
    
    this.emigoService.clearEmigo();
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
      let l: LabelEntry = await this.emigoService.addLabel("bff");
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
      a = await this.emigoService.addAttribute("0101", "data1");
      this.attributeId = a.attribute.attributeId;
      await this.emigoService.addAttribute("0101", "data2");
      await this.emigoService.addAttribute("0101", "data3");
      console.log(a);
      console.log("set label:");
      a = await this.emigoService.setAttributeLabel(this.attributeId, this.labelId);
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
      let msg: EmigoMessage = await this.registryService.getMessage(this.contact[0].registry, this.contact[0].emigoId);
      let emigo: EmigoEntry = await this.emigoService.addEmigo(msg);
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
      let label: LabelEntry = await this.groupService.addLabel(this.node, tok, "LABLER");
      let bad: AttributeEntry = await this.profileService.addAttribute(this.node, tok, "1010", "bad stuff");
      await this.profileService.setAttributeLabel(this.node, tok, bad.attribute.attributeId, label.labelId);
      await this.indexService.setEmigoLabel(this.node, tok, entry.emigoId, label.labelId);
      let good: AttributeEntry = await this.profileService.addAttribute(this.node, tok, "0101", "good stuff");
      await this.profileService.setAttributeLabel(this.node, tok, good.attribute.attributeId, label.labelId);
      await this.indexService.setEmigoLabel(this.node, tok, entry.emigoId, label.labelId);

      // should have profile within 10 seconds
      let profile: Attribute[];
      for(let i = 0; i < 5; i++) {
        await this.timeout(2);
        profile = await this.emigoService.getContactProfile(emigo.emigoId);
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
      let msg: EmigoMessage = await this.registryService.getMessage(this.act.registry, this.act.emigoId);
      let entry: EmigoEntry = await this.indexService.addEmigo(this.node, tok, msg);
      let connection: ShareEntry = await this.shareService.addConnection(this.node, tok, entry.emigoId);
      await this.shareService.updateStatus(this.node, tok, connection.shareId, "requesting", null);
      let message: ShareMessage = await this.shareService.getMessage(this.node, tok, connection.shareId);
      let issue: ShareStatus = await this.shareService.setMessage(this.node, this.act.emigoId, message);

      let contacts: PendingContact[] = [];
      this.emigoService.pendingContacts.subscribe(e => {
        contacts = e;    
      });
      for(let i = 0; i < 5; i++) {
        await this.timeout(2);
        if(contacts.length == 1) {
          break;
        }
      }
      if(contacts.length != 1) {
        throw new Error("invalid contacts emigos");
      }
      let pending: PendingEmigo = await this.emigoService.getPending(contacts[0].shareId);
      let emigo: EmigoEntry = await this.emigoService.addEmigo(pending.message);
      let share: ShareEntry = await this.emigoService.addConnection(emigo.emigoId);
      let status: string = await this.emigoService.openConnection(emigo.emigoId, share.shareId, this.node);

      let label: LabelEntry = await this.groupService.addLabel(this.node, tok, "LABLER");
      let bad: AttributeEntry = await this.profileService.addAttribute(this.node, tok, "1010", "bad stuff2");
      await this.profileService.setAttributeLabel(this.node, tok, bad.attribute.attributeId, label.labelId);
      await this.indexService.setEmigoLabel(this.node, tok, entry.emigoId, label.labelId);
      let good: AttributeEntry = await this.profileService.addAttribute(this.node, tok, "0101", "good stuff2");
      await this.profileService.setAttributeLabel(this.node, tok, good.attribute.attributeId, label.labelId);
      await this.indexService.setEmigoLabel(this.node, tok, entry.emigoId, label.labelId);

      // should have profile within 10 seconds
      let profile: Attribute[];
      for(let i = 0; i < 5; i++) {
        await this.timeout(2);
        profile = await this.emigoService.getContactProfile(emigo.emigoId);
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
      let label: LabelEntry = await this.emigoService.addLabel("friend");
      let attr: AttributeEntry = await this.emigoService.addAttribute("0101", "coffee");
      await this.emigoService.setAttributeLabel(attr.attribute.attributeId, label.labelId);
      await this.emigoService.setAttributeLabel(attr.attribute.attributeId, this.labelId);
      await this.emigoService.setEmigoLabel(this.contact[0].emigoId, label.labelId);
      await this.emigoService.setEmigoLabel(this.contact[0].emigoId, this.labelId);
    }
    catch(e) {
      console.log("sharing profile failed");
      console.error(e);
      return;
    }

    // reset services
    this.emigoService.clearEmigo();

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
    let emigo = await this.accessService.createUser(this.node, this.token, msg);
    let usr = await this.accessService.assignUser(this.node, token.token, emigo)
    let m = await this.identityService.setRegistry(this.node, usr.accountToken, this.registry);
    await this.registryService.setMessage(this.registry, m);

    return { "emigoId": usr.emigoId, "accountNode": this.node, "accountToken": usr.accountToken, "registry": this.registry,
        "appNode": this.node, "appToken": usr.serviceToken };
  }

}

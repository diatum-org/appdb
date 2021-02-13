import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptModule } from "@nativescript/angular";
import { NativeScriptHttpClientModule } from "@nativescript/angular";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";

import { EmigoService } from './lib/emigo.service';
import { StoreService } from './lib/store.service';
import { BitmapService } from './lib/bitmap.service';
import { RegistryService } from './lib/registry.service';
import { AccessService } from './lib/access.service';
import { IdentityService } from './lib/identity.service';
import { GroupService } from './lib/group.service';
import { ProfileService } from './lib/profile.service';
import { IndexService } from './lib/index.service';
import { ShareService } from './lib/share.service';
import { ContactService } from './lib/contact.service';
import { TokenService } from './lib/token.service';
import { ShowService } from './lib/show.service';
import { ViewService } from './lib/view.service';

import { RootComponent } from './root/root.component';
import { SocialComponent } from './social/social.component';
import { ContactComponent } from './contact/contact.component';

@NgModule({
    bootstrap: [
        AppComponent
    ],
    imports: [
        NativeScriptModule,
        NativeScriptHttpClientModule,
        AppRoutingModule
    ],
    declarations: [
        AppComponent,
        RootComponent,
        SocialComponent,
        ContactComponent
    ],
    providers: [
      EmigoService,
      StoreService,
      BitmapService,
      RegistryService,
      AccessService,
      IdentityService,
      GroupService,
      ProfileService,
      IndexService,
      ShareService,
      ContactService,
      TokenService,
      ShowService,
      ViewService
    ],
    schemas: [
        NO_ERRORS_SCHEMA
    ]
})
/*
Pass your application module to the bootstrapModule function located in main.ts to start your app
*/
export class AppModule { }

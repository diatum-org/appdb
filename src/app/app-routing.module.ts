import { NgModule } from "@angular/core";
import { Routes } from "@angular/router";
import { NativeScriptRouterModule } from "@nativescript/angular";

import { RootComponent } from "./root/root.component";
import { ContactComponent } from "./contact/contact.component";
import { SocialComponent } from "./social/social.component";

const routes: Routes = [
    { path: "", redirectTo: "/root", pathMatch: "full" },
    { path: "root", component: RootComponent },
    { path: "social", component: SocialComponent },
    { path: "contact", component: ContactComponent }
];

@NgModule({
    imports: [NativeScriptRouterModule.forRoot(routes)],
    exports: [NativeScriptRouterModule]
})
export class AppRoutingModule { }

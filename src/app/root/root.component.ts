import { Component, OnInit, OnDestroy } from "@angular/core";
import { RouterExtensions } from "@nativescript/angular";
import { Subscription } from 'rxjs'; 
import { Page } from "tns-core-modules/ui/page";

@Component({
    selector: "root",
    moduleId: module.id,
    templateUrl: "./root.component.xml"
})
export class RootComponent implements OnInit, OnDestroy {

  constructor(private router: RouterExtensions) {
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
  }

  public social() {
    this.router.navigate(["/social"], { clearHistory: false });
 }

  public contact() {
    this.router.navigate(["/contact"], { clearHistory: false });
  }
}

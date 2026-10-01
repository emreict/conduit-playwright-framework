import { Component, ChangeDetectionStrategy } from "@angular/core";
import { HeaderComponent } from "./core/layout/header.component";
import { RouterOutlet } from "@angular/router";
import { FooterComponent } from "./core/layout/footer.component";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [HeaderComponent, RouterOutlet, FooterComponent],
})
export class AppComponent {}

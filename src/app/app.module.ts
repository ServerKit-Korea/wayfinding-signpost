import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { NgModule } from "@angular/core";
import { HttpModule, JsonpModule } from "@angular/http";
import { HttpClientModule } from "@angular/common/http";
import { APP_BASE_HREF } from "@angular/common";

// 3rd party module
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";

// Services
import { GatewayService } from "./services/gateway.service";
import { DataService } from "./services/data.service";
import { EventService } from "./services/event.service";

// Pipeline
import { TruncatePipe } from "./common/TruncatePipe";
import { SafePipe } from "./common/SafeUrlPipe";

// app.component & module
import { AppComponent } from "./app.component";
import { routing, mainRoutingProviders } from "./app-routing.module"; // We also import our Route

@NgModule({
  declarations: [AppComponent, TruncatePipe, SafePipe],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpModule,
    HttpClientModule,
    JsonpModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule.forRoot(),

    // app router
    routing,
    mainRoutingProviders
  ],
  providers: [
    GatewayService,
    DataService,
    EventService,
    { provide: APP_BASE_HREF, useValue: "/" },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

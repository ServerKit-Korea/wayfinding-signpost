import { Routes, RouterModule } from "@angular/router";
import { AppComponent } from "./app.component";

export const mainRoutes: Routes = [
  { path: "./:screenId&:matrixId&:zoneId", component: AppComponent }
];
export const mainRoutingProviders: any[] = [];
export const routing = RouterModule.forRoot(mainRoutes);

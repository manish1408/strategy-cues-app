import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AuthGuard } from "./_guards/auth.guard";
import { OperatorGuard } from "./_guards/operator.guard";

const routes: Routes = [
  { path: '', redirectTo: 'signin', pathMatch: 'full' },
  {
    path: "",
    loadChildren: () =>
      import("./dashboard/dashboard.module").then((m) => m.DashboardModule),
    canActivate: [AuthGuard],
  },

  {
    path: "dashboard",
    loadChildren: () =>
      import("./dashboard/dashboard.module").then((m) => m.DashboardModule),
    canActivate: [AuthGuard],
  },

  {
    path: "theme",
    loadChildren: () =>
      import("./theme/theme.module").then((m) => m.ThemeModule),
    canActivate: [AuthGuard],
  },
  {
    path: "profile",
    loadChildren: () =>
      import("./settings/settings.module").then((m) => m.SettingsModule),
    canActivate: [AuthGuard],
  },

  {
    path: "signup",
    loadChildren: () =>
      import("./signup/signup.module").then((m) => m.SignupModule),
  },
  {
    path: "signin",
    loadChildren: () =>
      import("./signin/signin.module").then((m) => m.SigninModule),
  },
  {
    path: "verify-email",
    loadChildren: () =>
      import("./verify-email/verify-email.module").then(
        (m) => m.VerifyEmailModule
      ),
  },
  {
    path: "forgot-password",
    loadChildren: () =>
      import("./forgot-password/forgot-password.module").then(
        (m) => m.ForgotPasswordModule
      ),
  },
  {
    path: "change-password",
    loadChildren: () =>
      import("./change-password/change-password.module").then(
        (m) => m.ChangePasswordModule
      ),
  },
  {
    path: "all-operators",
    loadChildren: () =>
      import("./all-operators/all-operators.module").then((m) => m.AllOperatorsModule),
    canActivate: [AuthGuard],
  },
  {
    path: "all-users",
    loadChildren: () =>
      import("./all-users/all-users.module").then((m) => m.AllUsersModule),
    canActivate: [AuthGuard],
  },
  {
    path: "listing",
    loadChildren: () =>
      import("./listing/listing.module").then((m) => m.ListingModule),
    canActivate: [AuthGuard,OperatorGuard],
  },
  {
    path: "revenue",
    loadChildren: () =>
      import("./revenue/revenue.module").then((m) => m.RevenueModule),
    canActivate: [AuthGuard,OperatorGuard],
  },
  {
    path: "revenue/property-details/:id",
    loadChildren: () =>
      import("./revenue/property-details/property-details.module").then((m) => m.PropertyDetailsModule),
    canActivate: [AuthGuard,OperatorGuard],
  },
  {
    path: "content",
    loadChildren: () =>
      import("./content/content.module").then((m) => m.ContentModule),
    canActivate: [AuthGuard,OperatorGuard],
  },
  {
    path: "deployment",
    loadChildren: () =>
      import("./deployment/deployment.module").then((m) => m.DeploymentModule),
    canActivate: [AuthGuard,OperatorGuard],
  },
  {
    path: "status",
    loadChildren: () =>
      import("./status/status.module").then((m) => m.StatusModule),
    canActivate: [AuthGuard,OperatorGuard],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
// import { AuthGuard } from "./_guards/auth.guard";
// import { ChatbotGuard } from "./_guards/chatbot.guard";
// import { OnboardGuard } from "./_guards/onboard.guard";

const routes: Routes = [
  // { path: '', redirectTo: 'signin', pathMatch: 'full' },
  {
    path: "",
    loadChildren: () =>
      import("./dashboard/dashboard.module").then((m) => m.DashboardModule),
    // canActivate: [AuthGuard, ChatbotGuard],
  },

  {
    path: "dashboard",
    loadChildren: () =>
      import("./dashboard/dashboard.module").then((m) => m.DashboardModule),
    // canActivate: [AuthGuard, ChatbotGuard],
  },

  {
    path: "theme",
    loadChildren: () =>
      import("./theme/theme.module").then((m) => m.ThemeModule),
    // canActivate: [AuthGuard, ChatbotGuard],
  },
  {
    path: "profile",
    loadChildren: () =>
      import("./settings/settings.module").then((m) => m.SettingsModule),
    //  canActivate: [AuthGuard, ChatbotGuard],
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
    path: "revenue",
    loadChildren: () =>
      import("./revenue/revenue.module").then((m) => m.RevenueModule),
    // canActivate: [AuthGuard, ChatbotGuard],
  },
  {
    path: "content",
    loadChildren: () =>
      import("./content/content.module").then((m) => m.ContentModule),
    // canActivate: [AuthGuard, ChatbotGuard],
  },
  {
    path: "deployment",
    loadChildren: () =>
      import("./deployment/deployment.module").then((m) => m.DeploymentModule),
    // canActivate: [AuthGuard, ChatbotGuard],
  },
  {
    path: "status",
    loadChildren: () =>
      import("./status/status.module").then((m) => m.StatusModule),
    // canActivate: [AuthGuard, ChatbotGuard],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

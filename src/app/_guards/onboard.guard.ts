import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
// import { LocalStorageService } from '../_services/local-storage.service';
// import { WarningModalService } from '../_services/warning-modal.service';

@Injectable({
  providedIn: 'root',
})
export class OnboardGuard implements CanActivate {
  constructor(
    private router: Router,
    // private localStorageService: LocalStorageService,
    // private warningModalService: WarningModalService
  ) {}

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
     
    // const user = JSON.parse(this.localStorageService.getItem('MILO-USER'))  
    // const selectedChatbot = JSON.parse(this.localStorageService.getItem('selectedChatbot'))  
    // if (user?.isOnboarded && user?.onboardingStep === -1) {
    //   await this.router.navigate(['/dashboard'], { queryParams: { id: selectedChatbot.chatbotId } });
    //   return false;
    // }

    return true;
  }
}



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
export class ChatbotGuard implements CanActivate {
  constructor(
    private router: Router,
    // private localStorageService: LocalStorageService,
    // private warningModalService: WarningModalService
  ) {}

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    //  if (this.localStorageService.getItem('chatbotPresent') === 'true') {
    //   return true;
    // }

      // this.warningModalService.triggerModal(); 
    // await this.router.navigate(['/all-chatbots']); 
    // return false;
    return true;
  }
}



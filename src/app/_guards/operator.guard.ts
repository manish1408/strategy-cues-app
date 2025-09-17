import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { LocalStorageService } from '../_services/local-storage.service';
import { WarningModalService } from '../_services/warning-modal.service';

@Injectable({
  providedIn: 'root',
})
export class OperatorGuard implements CanActivate {
  constructor(
    private router: Router,
    private localStorageService: LocalStorageService,
    private warningModalService: WarningModalService
  ) {}

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    const operatorPresent = this.localStorageService.getItem('operatorPresent');
    console.log('🔒 Operator Guard - operatorPresent flag:', operatorPresent);
    console.log('🔒 Operator Guard - current route:', state.url);
    
    if (operatorPresent === 'true') {
      console.log('✅ Operator Guard - Access granted');
      return true;
    }

    console.log('❌ Operator Guard - No operators found, triggering warning modal');
    this.warningModalService.triggerModal(); 
    await this.router.navigate(['/all-operators']); 
    return false;
  }
}



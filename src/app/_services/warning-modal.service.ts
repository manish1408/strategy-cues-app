import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WarningModalService {
  showModalSubject = new BehaviorSubject<boolean>(false);
  showModal$ = this.showModalSubject.asObservable();

  triggerModal() {
    this.showModalSubject.next(true);
  }

  resetModal() {
    this.showModalSubject.next(false);
  }
}

import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { WarningModalService } from '../../../_services/warning-modal.service';
declare var bootstrap: any;
@Component({
  selector: 'app-warning-modal',
  templateUrl: './warning-modal.component.html',
  styleUrl: './warning-modal.component.scss'
})
export class WarningModalComponent {
  private modalInstance: any | null = null;

  constructor(private warningModalService: WarningModalService) {}

  ngOnInit() {
    const modalElement = document.getElementById('createChatbotWarning');

    if (modalElement) {
      this.modalInstance = new bootstrap.Modal(modalElement);

      this.warningModalService.showModal$.subscribe((show) => {
        if (show) {
          this.modalInstance?.show();
          this.warningModalService.resetModal(); 
        }
      });

      modalElement.addEventListener('hidden.bs.modal', () => {
        this.cleanupBackdrop();
      });
    }
  }

  ngOnDestroy() {
    this.modalInstance?.dispose();
    this.cleanupBackdrop();
  }

  private cleanupBackdrop() {
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach((backdrop) => backdrop.remove());
  }
}

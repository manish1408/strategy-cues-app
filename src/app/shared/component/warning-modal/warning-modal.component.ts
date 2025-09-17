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
      // Initialize modal with proper configuration
      this.modalInstance = new bootstrap.Modal(modalElement, {
        backdrop: true,
        keyboard: true,
        focus: true
      });

      this.warningModalService.showModal$.subscribe((show) => {
        if (show) {
          // Check if modal instance exists and is not already shown
          if (this.modalInstance && !modalElement.classList.contains('show')) {
            try {
              this.modalInstance.show();
              this.warningModalService.resetModal(); 
            } catch (error) {
              console.error('Error showing modal:', error);
            }
          }
        }
      });

      modalElement.addEventListener('hidden.bs.modal', () => {
        this.cleanupBackdrop();
      });
    }
  }

  ngOnDestroy() {
    if (this.modalInstance) {
      try {
        this.modalInstance.dispose();
      } catch (error) {
        console.error('Error disposing modal:', error);
      }
    }
    this.cleanupBackdrop();
  }

  private cleanupBackdrop() {
    // Remove all modal backdrops
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach((backdrop) => {
      try {
        backdrop.remove();
      } catch (error) {
        console.error('Error removing backdrop:', error);
      }
    });
    
    // Remove modal-open class from body
    document.body.classList.remove('modal-open');
    
    // Reset body padding if it was modified
    document.body.style.paddingRight = '';
  }
}

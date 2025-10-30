import { Component } from '@angular/core';
import { PricelabsService } from '../_services/pricelabs.service';
import { ActivatedRoute } from '@angular/router';
import { LocalStorageService } from '../_services/local-storage.service';

@Component({
  selector: 'app-pricelabs-admin',
  templateUrl: './pricelabs-admin.component.html',
  styleUrl: './pricelabs-admin.component.scss'
})
export class PricelabsAdminComponent {
loading: boolean = false;
data: any[] = [];
operatorId: string = '';
startDate: string = '';
endDate: string = '';
// isLoadingMore: boolean = false;
hasMoreData: boolean = true;
error: string | null = null;
reportId: string = '';
private previousOperatorId: string = '';

constructor(private pricelabsService: PricelabsService, private route: ActivatedRoute, private localStorageService: LocalStorageService) {
  
}

ngOnInit(): void {
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);
  this.startDate = this.formatDate(sevenDaysAgo);
  this.endDate = this.formatDate(today);
  this.route.queryParams.subscribe(params => {
    const idParam = params['operatorId'] || params['id'];
    const nextOperatorId = idParam || this.localStorageService.getSelectedOperatorId() || '';
    if (nextOperatorId && nextOperatorId !== this.previousOperatorId) {
      this.operatorId = nextOperatorId;
      this.previousOperatorId = nextOperatorId;
      // Auto-load when operator changes
      this.analyticsReport();
    }
  });
}

analyticsReport() {
  this.loading = true;
  this.error = null;
  this.pricelabsService.createAnalyticsReport(this.operatorId, this.startDate, this.endDate).subscribe({
    next: (resp) => {
      if (!resp || resp.success === false || resp.data === null) {
        this.error = resp?.error || '';
        this.data = [];
        this.loading = false;
        return;
      }
      this.reportId = resp.data;
      this.pricelabsService.getAnalyticsReport(this.reportId).subscribe({
        next: (reportResp) => {
          const rows = reportResp?.data?.reportData;
          if (reportResp?.success === false || !Array.isArray(rows)) {
            this.error = reportResp?.error || '';
            this.loading = false;
            return;
          }
          this.data = rows;
          this.loading = false;
        },
        error: (err) => {
          this.error = err?.error?.detail?.error || '';
          this.data = [];
          this.loading = false;
        }
      });
    },
    error: (err) => {
      this.error = err?.error?.detail?.error || '';
      this.data = [];
      this.loading = false;
    }
  });
}

onDateInputChange(kind: 'start' | 'end', value: string): void {
  if (!value) { return; }
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) { return; }
  if (kind === 'start') {
    this.startDate = this.formatDate(parsed);
  } else {
    this.endDate = this.formatDate(parsed);
  }
}

private formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

  // Scroll event handler for infinite scroll
  onScroll(event: any): void {
    const element = event.target;
    const threshold = 100; // pixels from bottom
    
    if (element.scrollTop + element.clientHeight >= element.scrollHeight - threshold) {
      this.analyticsReport();
    }
  }


  
}

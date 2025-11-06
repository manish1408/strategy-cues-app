import { Component, OnDestroy } from "@angular/core";
import { PricelabsService } from "../_services/pricelabs.service";
import { ActivatedRoute } from "@angular/router";
import { LocalStorageService } from "../_services/local-storage.service";
import { ToastrService } from "ngx-toastr";

// Declare global variables for Bootstrap
declare var bootstrap: any;

@Component({
  selector: "app-pricelabs-admin",
  templateUrl: "./pricelabs-admin.component.html",
  styleUrls: ["./pricelabs-admin.component.scss"],
})
export class PricelabsAdminComponent implements OnDestroy {
  loading: boolean = false;
  data: any[] = [];
  operatorId: string = "";
  startDate: string = "";
  endDate: string = "";
  // isLoadingMore: boolean = false;
  hasMoreData: boolean = true;
  error: string | null = null;
  reportId: string = "";
  private previousOperatorId: string = "";

  // Preset properties
  filterPresets: any[] = [];
  selectedPresetId: string = "";
  showSavePresetForm: boolean = false;
  newPresetName: string = "";
  presetSaveError: string = "";
  presetLoading: boolean = false;
  presetSaving: boolean = false;
  presetDeleting: boolean = false;
  // Temporary dates for preset modal (editable)
  presetStartDate: string = "";
  presetEndDate: string = "";

  // Export properties
  exportLoading: boolean = false;
  private exportPollingInterval: any = null;
  private exportPollingTimeout: any = null;
  private readonly MAX_POLLING_TIME = 5 * 60 * 1000; // 5 minutes max
  private pollingStartTime: number = 0;

  constructor(
    private pricelabsService: PricelabsService,
    private route: ActivatedRoute,
    private localStorageService: LocalStorageService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    this.startDate = this.formatDate(sevenDaysAgo);
    this.endDate = this.formatDate(today);
    this.route.queryParams.subscribe((params) => {
      const idParam = params["operatorId"] || params["id"];
      const nextOperatorId =
        idParam || this.localStorageService.getSelectedOperatorId() || "";
      if (nextOperatorId && nextOperatorId !== this.previousOperatorId) {
        this.operatorId = nextOperatorId;
        this.previousOperatorId = nextOperatorId;
        // Load presets when operator changes
        this.loadPresets();
        // Auto-load when operator changes
        this.analyticsReport();
      }
    });
  }

  analyticsReport() {
    if (!this.operatorId) {
      this.error =
        "Operator not selected. Pass ?operatorId=... in URL or select an operator.";
      this.data = [];
      this.loading = false;
      return;
    }
    this.loading = true;
    this.error = null;
    this.pricelabsService
      .createAnalyticsReport(this.operatorId, this.startDate, this.endDate)
      .subscribe({
        next: (resp) => {
          if (!resp || resp.success === false || resp.data === null) {
            this.error = resp?.error || "";
            this.data = [];
            this.loading = false;
            return;
          }
          this.reportId = resp.data;
          this.pricelabsService.getAnalyticsReport(this.reportId).subscribe({
            next: (reportResp) => {
              // Support multiple possible response shapes
              const payload = reportResp?.data ?? reportResp;
              const rows = Array.isArray(payload)
                ? payload
                : Array.isArray(payload?.reportData)
                ? payload.reportData
                : [];

              if (reportResp?.success === false) {
                this.error = reportResp?.error || "";
                this.data = [];
                this.loading = false;
                return;
              }

              this.data = Array.isArray(rows) ? rows : [];
              this.loading = false;
            },
            error: (err) => {
              this.error = err?.error?.detail?.error || "";
              this.data = [];
              this.loading = false;
            },
          });
        },
        error: (err) => {
          this.error = err?.error?.detail?.error || "";
          this.data = [];
          this.loading = false;
        },
      });
  }

  onDateInputChange(kind: "start" | "end", value: string): void {
    if (!value) {
      return;
    }
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) {
      return;
    }
    if (kind === "start") {
      this.startDate = this.formatDate(parsed);
    } else {
      this.endDate = this.formatDate(parsed);
    }
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Scroll event handler for infinite scroll
  onScroll(event: any): void {
    const element = event.target;
    const threshold = 100; // pixels from bottom

    if (
      element.scrollTop + element.clientHeight >=
      element.scrollHeight - threshold
    ) {
      this.analyticsReport();
    }
  }

  safeParseNumber(value: any): number {
    if (value === null || value === undefined) {
      return 0;
    }
    const parsed =
      typeof value === "string" ? parseFloat(value) : Number(value);
    return isFinite(parsed) ? parsed : 0;
  }

  // Get color based on occupancy percentage
  getOccupancyColor(percentage: number, isLight: boolean = false): string {
    if (percentage >= 66) {
      // Green for high occupancy (70%+)
      return isLight ? "#C7E596" : "#78C000";
    } else if (percentage >= 33) {
      // Amber/Orange for medium occupancy (30-69%)
      return isLight ? "#FFE4B5" : "#FF8C00";
    } else {
      // Red for low occupancy (0-29%)
      return isLight ? "#FFC0CB" : "#FF6347";
    }
  }

  onImageError(event: any): void {
    // Set fallback image when the main image fails to load
    event.target.src = "assets/images/placeholder.jpg";
  }

  getPropertyImage(property: any): string {
    if (property.listingDetails?.airbnbPhoto) {
      return property.listingDetails.airbnbPhoto;
    }
    if (property.listingDetails?.bookingPhoto) {
      return property.listingDetails.bookingPhoto;
    }
    return "assets/images/placeholder.jpg";
  }

  // Preset methods
  loadPresets(): void {
    if (!this.operatorId) {
      this.filterPresets = [];
      return;
    }

    this.presetLoading = true;
    this.pricelabsService.getAnalyticsCuesPresets(this.operatorId).subscribe({
      next: (response) => {
        this.presetLoading = false;
        if (response && response.success && response.data) {
          // Handle array or object response
          const presetsArray = Array.isArray(response.data)
            ? response.data
            : Array.isArray(response.data.presets)
            ? response.data.presets
            : [];

          this.filterPresets = presetsArray.map((preset: any) => ({
            id: preset._id || preset.id,
            name: preset.preset_name || preset.name,
            startDate: preset.start_date,
            endDate: preset.end_date,
            createdAt: preset.createdAt
              ? new Date(preset.createdAt)
              : new Date(),
          }));
        } else {
          this.filterPresets = [];
        }
      },
      error: (error) => {
        this.presetLoading = false;
        console.error("Error loading presets:", error);
        this.filterPresets = [];
      },
    });
  }

  showSavePresetDialog(): void {
    // Prefill with current dates
    this.presetStartDate = this.startDate;
    this.presetEndDate = this.endDate;
    this.showSavePresetForm = true;
    this.newPresetName = "";
    this.presetSaveError = "";
  }

  cancelSavePreset(): void {
    this.showSavePresetForm = false;
    this.newPresetName = "";
    this.presetSaveError = "";
    this.presetStartDate = "";
    this.presetEndDate = "";
  }

  onPresetDateChange(kind: "start" | "end", value: string): void {
    if (!value) {
      return;
    }
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) {
      return;
    }
    if (kind === "start") {
      this.presetStartDate = this.formatDate(parsed);
    } else {
      this.presetEndDate = this.formatDate(parsed);
    }
  }

  saveCurrentFiltersAsPreset(): void {
    if (!this.newPresetName.trim()) {
      this.presetSaveError = "Please enter a preset name";
      return;
    }

    if (!this.operatorId) {
      this.presetSaveError = "Operator ID is required";
      return;
    }

    if (!this.presetStartDate || !this.presetEndDate) {
      this.presetSaveError = "Start date and end date are required";
      return;
    }

    this.presetSaving = true;
    this.presetSaveError = "";

    this.pricelabsService
      .createAnalyticsCuesPreset(
        this.operatorId,
        this.newPresetName.trim(),
        this.presetStartDate,
        this.presetEndDate
      )
      .subscribe({
        next: (response) => {
          this.presetSaving = false;
          if (response && response.success) {
            this.toastr.success(
              `Preset "${this.newPresetName}" saved successfully!`
            );
            this.cancelSavePreset();
            // Reload presets
            this.loadPresets();
          } else {
            this.presetSaveError = response?.error || "Failed to save preset";
            this.toastr.error(this.presetSaveError);
          }
        },
        error: (error) => {
          this.presetSaving = false;
          this.presetSaveError =
            error?.error?.detail?.error ||
            error?.error?.message ||
            "Failed to save preset";
          this.toastr.error(this.presetSaveError);
          console.error("Error saving preset:", error);
        },
      });
  }

  onPresetSelectionChange(): void {
    if (this.selectedPresetId && this.filterPresets.length > 0) {
      const preset = this.filterPresets.find(
        (p) => p.id === this.selectedPresetId
      );
      if (preset) {
        this.startDate = preset.startDate;
        this.endDate = preset.endDate;
        // Automatically trigger analytics report when preset is selected
        this.analyticsReport();
      }
    }
  }

  deletePreset(presetId: string): void {
    if (!this.operatorId) {
      this.toastr.error("Operator ID is required");
      return;
    }

    const preset = this.filterPresets.find((p) => p.id === presetId);
    const presetName = preset?.name || "preset";

    if (
      !confirm(`Are you sure you want to delete the preset "${presetName}"?`)
    ) {
      return;
    }

    this.presetDeleting = true;
    this.pricelabsService
      .deleteAnalyticsCuesPreset(presetId, this.operatorId)
      .subscribe({
        next: (response) => {
          this.presetDeleting = false;
          if (response && response.success !== false) {
            this.toastr.success(`Preset "${presetName}" deleted successfully!`);
            if (this.selectedPresetId === presetId) {
              this.selectedPresetId = "";
            }
            // Reload presets
            this.loadPresets();
          } else {
            this.toastr.error("Failed to delete preset");
          }
        },
        error: (error) => {
          console.error("Error deleting preset:", error);
          this.presetDeleting = false;
          this.toastr.error("Failed to delete preset");
        },
      });
  }

  getPresetSummary(preset: any): string[] {
    const summary: string[] = [];
    if (preset.startDate) {
      summary.push(`Start: ${preset.startDate}`);
    }
    if (preset.endDate) {
      summary.push(`End: ${preset.endDate}`);
    }
    return summary;
  }

  getSelectedPresetName(): string {
    if (this.selectedPresetId && this.filterPresets.length > 0) {
      const preset = this.filterPresets.find(
        (p) => p.id === this.selectedPresetId
      );
      return preset?.name || "";
    }
    return "";
  }

  clearPreset(): void {
    this.selectedPresetId = "";
    // Reset dates to default (7 days ago to today)
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    this.startDate = this.formatDate(sevenDaysAgo);
    this.endDate = this.formatDate(today);
    // Trigger API call with default dates
    this.analyticsReport();
  }

  onManualSubmit(): void {
    // Clear preset when user manually submits with different dates
    // Don't reset dates - keep the user's manually entered dates
    this.selectedPresetId = "";
    this.analyticsReport();
  }

  // Export CSV methods
  exportToCSV(): void {
    if (!this.operatorId || !this.startDate || !this.endDate) {
      this.toastr.error("Operator ID, start date, and end date are required");
      return;
    }

    this.exportLoading = true;

    this.pricelabsService
      .createExcelSchedule(this.operatorId, this.startDate, this.endDate)
      .subscribe({
        next: (response) => {
          if (response && response.success !== false) {
            // Handle different response formats
            const scheduleId =
              response?.data?.schedule_id ||
              response?.data?.id ||
              response?.schedule_id ||
              response?.id ||
              response?.data;

            if (scheduleId) {
              this.startExportPolling(scheduleId);
            } else {
              this.exportLoading = false;
              this.toastr.error(
                "Schedule ID not found in response",
                "Export CSV"
              );
            }
          } else {
            this.exportLoading = false;
            const errorMsg =
              response?.error ||
              response?.message ||
              "Failed to create export schedule";
            this.toastr.error(errorMsg);
          }
        },
        error: (error) => {
          this.exportLoading = false;
          const errorMsg =
            error?.error?.detail?.error ||
            error?.error?.message ||
            "Failed to create export schedule";
          this.toastr.error(errorMsg);
          console.error("Error creating export schedule:", error);
        },
      });
  }

  private startExportPolling(scheduleId: string): void {
    // Clear any existing polling
    this.stopExportPolling();

    this.pollingStartTime = Date.now();

    // Set timeout to stop polling after max time
    this.exportPollingTimeout = setTimeout(() => {
      this.stopExportPolling();
      this.exportLoading = false;
      this.toastr.error(
        "Export took too long. Please try again.",
        "Export CSV"
      );
    }, this.MAX_POLLING_TIME);

    // Poll every 3 seconds
    this.exportPollingInterval = setInterval(() => {
      // Check if we've exceeded max polling time
      if (Date.now() - this.pollingStartTime > this.MAX_POLLING_TIME) {
        this.stopExportPolling();
        this.exportLoading = false;
        this.toastr.error(
          "Export took too long. Please try again.",
          "Export CSV"
        );
        return;
      }
      this.checkExportStatus(scheduleId);
    }, 3000);

    // Check immediately
    this.checkExportStatus(scheduleId);
  }

  private stopExportPolling(): void {
    if (this.exportPollingInterval) {
      clearInterval(this.exportPollingInterval);
      this.exportPollingInterval = null;
    }
    if (this.exportPollingTimeout) {
      clearTimeout(this.exportPollingTimeout);
      this.exportPollingTimeout = null;
    }
    this.pollingStartTime = 0;
  }

  private checkExportStatus(scheduleId: string): void {
    this.pricelabsService.getExcelScheduleStatus(scheduleId).subscribe({
      next: (response) => {
        const data = response?.data || response;
        const status = data?.status || data?.Status;

        if (status === "completed") {
          this.stopExportPolling();
          this.exportLoading = false;

          const fileUrl = data?.url || data?.file_url || data?.fileUrl;
          if (fileUrl) {
            this.downloadFile(fileUrl);
            this.toastr.success("Export completed successfully!", "Export CSV");
          } else {
            this.toastr.error("Export completed but file URL not found");
          }
        } else if (status === "failed" || status === "error") {
          this.stopExportPolling();
          this.exportLoading = false;
          const errorMsg = data?.error || data?.message || "Export failed";
          this.toastr.error(errorMsg, "Export CSV");
        }
        // If status is 'pending' or 'processing', continue polling
      },
      error: (error) => {
        // Don't stop polling on network errors, but log them
        console.error("Error checking export status:", error);
        // Only stop polling if it's a clear failure (not a network issue)
        if (error?.status === 404) {
          this.stopExportPolling();
          this.exportLoading = false;
          this.toastr.error("Export schedule not found", "Export CSV");
        }
      },
    });
  }

  private downloadFile(url: string): void {
    // Open the URL in a new tab/window to trigger download
    window.open(url, "_blank", "noopener,noreferrer");
  }

  ngOnDestroy(): void {
    this.stopExportPolling();
  }
}

import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { FileManagementService, FileResponse } from '../_services/file-management.service';
import { ToastrService } from 'ngx-toastr';
import { ToastService } from '../_services/toast.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-file-management',
  templateUrl: './file-management.component.html',
  styleUrl: './file-management.component.scss'
})
export class FileManagementComponent implements OnInit {
  @ViewChild('closeButton') closeButton!: ElementRef;

  filesList: FileResponse[] = [];
  loading: boolean = false;
  uploading: boolean = false;
  currentPage: number = 0;
  limit: number = 10;
  totalFiles: number = 0;
  totalPages: number = 0;
  hasMoreData: boolean = true;

  // File upload
  selectedFile: File | null = null;
  
  // File validation
  readonly allowedFileTypes = ['.pdf', '.csv', '.xls', '.xlsx', '.json'];
  readonly allowedMimeTypes = [
    'application/pdf',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/json'
  ];
  readonly maxFileSize = 10 * 1024 * 1024; // 10MB in bytes
  readonly acceptFileTypes = '.pdf,.csv,.xls,.xlsx,.json';

  constructor(
    private fileManagementService: FileManagementService,
    private toastr: ToastrService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadFiles();
  }

  loadFiles() {
    this.loading = true;
    const skip = this.currentPage * this.limit;
    
    this.fileManagementService
      .getFiles(skip, this.limit)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res: any) => {
          if (res.success && res.data) {
            const files = res.data.files || [];
            const pagination = res.data.pagination;
            
            if (this.currentPage === 0) {
              this.filesList = files;
            } else {
              this.filesList = [...this.filesList, ...files];
            }
            
            if (pagination) {
              this.totalFiles = pagination.total || 0;
              this.totalPages = pagination.total_pages || 0;
              this.hasMoreData = this.currentPage < this.totalPages - 1;
            } else {
              // If no pagination info, check if we got less than limit
              this.hasMoreData = files.length === this.limit;
            }
          } else {
            this.toastr.error(res.message || 'Failed to load files');
          }
        },
        error: (error: any) => {
          this.toastr.error(error.error?.message || 'Failed to load files');
          console.error('Error loading files:', error);
        },
      });
  }

  loadMore() {
    if (!this.loading && this.hasMoreData) {
      this.currentPage++;
      this.loadFiles();
    }
  }

  onFileSelect(event: any) {
    // Handle rejected files first with specific error messages
    if (event.rejectedFiles && event.rejectedFiles.length > 0) {
      const rejectedFile = event.rejectedFiles[0];
      
      // Check file type
      if (!this.isValidFileType(rejectedFile)) {
        this.toastr.error('Invalid file type. Only PDF, CSV, Excel (.xls, .xlsx), and JSON files are allowed.');
        this.selectedFile = null;
        return;
      }
      
      // Check file size
      if (rejectedFile.size > this.maxFileSize) {
        this.toastr.error(`File size exceeds the maximum limit of 10MB. Current file size: ${(rejectedFile.size / (1024 * 1024)).toFixed(2)}MB`);
        this.selectedFile = null;
        return;
      }
      
      // Generic rejection error
      this.toastr.error('File selection failed. Please try again.');
      this.selectedFile = null;
      return;
    }
    
    // Handle added files
    const files = event.addedFiles;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Validate file type
      if (!this.isValidFileType(file)) {
        this.toastr.error('Invalid file type. Only PDF, CSV, Excel (.xls, .xlsx), and JSON files are allowed.');
        this.selectedFile = null;
        return;
      }
      
      // Validate file size
      if (file.size > this.maxFileSize) {
        this.toastr.error(`File size exceeds the maximum limit of 10MB. Current file size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
        this.selectedFile = null;
        return;
      }
      
      this.selectedFile = file;
    }
  }

  isValidFileType(file: File): boolean {
    // Check by file extension
    const fileName = file.name.toLowerCase();
    const hasValidExtension = this.allowedFileTypes.some(ext => fileName.endsWith(ext));
    
    // Check by MIME type
    const hasValidMimeType = this.allowedMimeTypes.includes(file.type);
    
    return hasValidExtension || hasValidMimeType;
  }

  onFileRemove() {
    this.selectedFile = null;
  }

  uploadFile() {
    if (!this.selectedFile) {
      this.toastr.error('Please select a file to upload');
      return;
    }

    // Validate file type before upload
    if (!this.isValidFileType(this.selectedFile)) {
      this.toastr.error('Invalid file type. Only PDF, CSV, Excel (.xls, .xlsx), and JSON files are allowed.');
      return;
    }

    // Validate file size before upload
    if (this.selectedFile.size > this.maxFileSize) {
      this.toastr.error(`File size exceeds the maximum limit of 10MB. Current file size: ${(this.selectedFile.size / (1024 * 1024)).toFixed(2)}MB`);
      return;
    }

    this.uploading = true;
    this.fileManagementService
      .uploadFile(this.selectedFile)
      .pipe(finalize(() => (this.uploading = false)))
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            this.toastr.success('File uploaded successfully');
            this.selectedFile = null;
            this.closeModal();
            // Reset pagination and reload
            this.currentPage = 0;
            this.loadFiles();
          } else {
            this.toastr.error(res.message || 'Failed to upload file');
          }
        },
        error: (error: any) => {
          this.toastr.error(error.error?.message || 'Failed to upload file');
          console.error('Error uploading file:', error);
        },
      });
  }

  deleteFile(fileId: string) {
    this.toastService.showConfirm(
      'Are you sure?',
      'Delete the selected file?',
      'Yes, delete it!',
      'No, cancel',
      () => {
        this.loading = true;
        this.fileManagementService
          .deleteFile(fileId)
          .pipe(finalize(() => (this.loading = false)))
          .subscribe({
            next: (res: any) => {
              if (res.success) {
                this.toastr.success('File deleted successfully');
                // Reset pagination and reload
                this.currentPage = 0;
                this.loadFiles();
              } else {
                this.toastr.error(res.message || 'Failed to delete file');
              }
            },
            error: (error: any) => {
              this.toastr.error(error.error?.message || 'Failed to delete file');
              console.error('Error deleting file:', error);
            },
          });
      },
      () => {
        // Cancel callback
      }
    );
  }

  closeModal() {
    const modalElement = document.getElementById('uploadFileModal');
    if (modalElement) {
      const modal = (window as any).bootstrap?.Modal?.getInstance(modalElement);
      if (modal) {
        modal.hide();
      } else {
        const closeButton = modalElement.querySelector(
          '[data-bs-dismiss="modal"]'
        ) as HTMLElement;
        if (closeButton) {
          closeButton.click();
        }
      }
    }
    // Reset file selection
    this.selectedFile = null;
  }

  getFileId(file: FileResponse): string {
    return file.id || '';
  }

  

  getFileUrl(file: FileResponse): string {
    return file.url || '';
  }

  getTruncatedUrl(file: FileResponse, maxLength: number = 50): string {
    const url = this.getFileUrl(file);
    if (!url) return '';
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  }

  getUploadedDate(file: FileResponse): string {
    if (!file.created_at) return 'N/A';
    return new Date(file.created_at).toLocaleDateString();
  }
}

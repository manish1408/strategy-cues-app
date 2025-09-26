import { Injectable } from '@angular/core';
declare var NioApp: any;
declare var Swal: any;

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  constructor() {}

  showError(
    message: string,
    duration: number = 5000,
    position: ToastLocation = ToastLocation.TopRight,
    showCloseButton: boolean = true
  ) {
    if (message) {
      Swal.fire('Error', message, 'error');
    }
  }

  showInfo(
    message: string,
    duration: number = 5000,
    position: ToastLocation = ToastLocation.TopRight,
    showCloseButton: boolean = true
  ) {
    Swal.fire('Info', message, 'info');
  }

  showSuccess(
    message: string,
    duration: number = 5000,
    position: ToastLocation = ToastLocation.TopRight,
    showCloseButton: boolean = true
  ) {
    Swal.fire('Success', message, 'success');
  }

  showWarning(
    message: string,
    duration: number = 5000,
    position: ToastLocation = ToastLocation.TopRight,
    showCloseButton: boolean = true
  ) {
    Swal.fire(message);
  }
  showConfirm(
    title: string,
    text: string,
    confirmButtonText: string = 'Yes',
    cancelButtonText: string = 'No',
    confirmCallback?: () => void,
    cancelCallback?: () => void
  ) {
    Swal.fire({
      title: title,
      text: text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: confirmButtonText,
      cancelButtonText: cancelButtonText,
    }).then((result: any) => {
      if (result.isConfirmed && confirmCallback) {
        confirmCallback();
      } else if (
        result.dismiss === Swal.DismissReason.cancel &&
        cancelCallback
      ) {
        cancelCallback();
      }
    });
  }

  showInput(
    title: string,
    text: string,
    inputValue: string = '',
    inputPlaceholder: string = '',
    confirmButtonText: string = 'OK',
    cancelButtonText: string = 'Cancel',
    confirmCallback?: (value: string) => void,
    cancelCallback?: () => void
  ) {
    Swal.fire({
      title: title,
      text: text,
      input: 'text',
      inputValue: inputValue,
      inputPlaceholder: inputPlaceholder,
      showCancelButton: true,
      confirmButtonText: confirmButtonText,
      cancelButtonText: cancelButtonText,
    }).then((result: any) => {
      if (result.isConfirmed && confirmCallback) {
        confirmCallback(result.value);
      } else if (
        result.dismiss === Swal.DismissReason.cancel &&
        cancelCallback
      ) {
        cancelCallback();
      }
    });
  }
}

export enum ToastLocation {
  Default = 'default',
  BottomCenter = 'bottom-center',
  BottomLeft = 'bottom-left',
  BottomRight = 'bottom-right',
  BottomFullWidth = 'bottom-full',
  TopCenter = 'top-center',
  TopLeft = 'top-left',
  TopRight = 'top-right',
  TopFullWidth = 'top-full',
}

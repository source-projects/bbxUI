import { Injectable } from '@angular/core';
import { NbToastrConfig, NbToastRef, NbToastrService } from '@nebular/theme';
import { Subscription } from 'rxjs/internal/Subscription';

export interface ToastRef {
  subscription?: Subscription;
  toast: NbToastRef;
}

@Injectable({
  providedIn: 'root'
})
export class BbxToastrService {
  private maxToastCount: number = 5;

  private _toastrRef?: ToastRef;
  private _toastrOpened: boolean = false;

  private toastrRefStack: ToastRef[] = [];

  get IsToastrOpened() { return this.toastrRefStack.length > 0; }

  constructor(private toastrService: NbToastrService) { }

  show(message: any, title?: any, userConfig?: Partial<NbToastrConfig>): NbToastRef {
    this._toastrRef = { toast: this.toastrService.show(message, title, userConfig) } as ToastRef;
    this.toastrRefStack.push(this._toastrRef);
    if (this.toastrRefStack.length > this.maxToastCount) {
      let i = 0;
      for (; i < this.maxToastCount - 1; i++) {
        let temp = this.toastrRefStack[i];
        temp.subscription?.unsubscribe();
        temp.toast.close();
      }
      this.toastrRefStack.splice(0, i + 1);
    }
    this._toastrRef.subscription = this._toastrRef.toast.onClose().subscribe({
      next: () => { this._toastrOpened = false; this.toastrRefStack.pop(); }
    });
    this._toastrOpened = true;
    return this._toastrRef?.toast;
  }

  close(): void {
    if (this.IsToastrOpened) {
      const tmp = this.toastrRefStack[this.toastrRefStack.length - 1] ?? undefined;
      tmp?.toast.close();
    }
  }

  logToastrStats(): void {
    console.log(`Max toastrs: ${this.maxToastCount}, is any opened: ${this.IsToastrOpened}, current stack: `);
    console.log(this.toastrRefStack);
  }
}

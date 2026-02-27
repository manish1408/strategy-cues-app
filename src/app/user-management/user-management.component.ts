import { Component, ElementRef, ViewChild } from "@angular/core";
import { OperatorService } from "../_services/operator.service";
import { ToastrService } from "ngx-toastr";
import { finalize, forkJoin, of } from "rxjs";
import { map, catchError } from "rxjs/operators";
import { AuthenticationService } from "../_services/authentication.service";
import { ToastService } from "../_services/toast.service";

@Component({
  selector: "app-user-management",
  templateUrl: "./user-management.component.html",
  styleUrl: "./user-management.component.scss",
})
export class UserManagementComponent {
  @ViewChild("closeButton") closeButton!: ElementRef;

  apiLoading: boolean = false;
  loading: boolean = false;
  allOperatorList: any[] = [];
  allUsersList: any[] = [];
  private operatorsByIdMap: Map<string, any> = new Map<string, any>();
  private operatorsByUserIdMap: Map<string, Set<string>> = new Map<string, Set<string>>();
  selectedUser: any | null = null;
  selectedOperators: any[] = []; // For ngModel binding
  availableOperatorsForDropdown: any[] = []; // Cached dropdown options
  isSubmitted = false;
  userLoading: boolean = false;
  constructor(
    private operatorService: OperatorService,
    private toastr: ToastrService,
    private authService: AuthenticationService,
    private toastService: ToastService
  ) {
  }

  ngOnInit() {
    this.loadOperatorsAndUser();
  }

  loadOperatorsAndUser() {
    this.apiLoading = true;
    this.operatorService.getAllOperatorList().subscribe({
      next: (res: any) => {
        this.allOperatorList = res?.data?.operators ?? [];
        this.operatorsByIdMap = this.buildOperatorsByIdMap(this.allOperatorList);
        this.operatorsByUserIdMap = this.buildOperatorsByUserIdMap(this.allOperatorList);
        this.authService
          .getAllUsers()
          .pipe(finalize(() => (this.apiLoading = false)))
          .subscribe({
            next: (_res: any) => {
              this.allUsersList = _res?.data?.users ?? [];
            },
            error: (error: any) => {
              this.toastr.error("Failed to load users");
              this.apiLoading = false;
            },
          });
      },
      error: (error: any) => {
        this.toastr.error("Failed to load operators");
        this.apiLoading = false;
      },
    });
  }

  getOperatorDisplayName(operator: any): string {
    if (!operator) {
      return "";
    }
    return operator.name || operator._id || "";
  }

  getOperatorsForUser(user: any): Array<{ id: string; name: string }> {
    if (!user || !user.id) {
      return [];
    }

    const operatorIds = this.operatorsByUserIdMap.get(user.id);
    if (!operatorIds || operatorIds.size === 0) {
      return [];
    }

    return Array.from(operatorIds)
      .map((operatorId: string) => {
        const operator = this.operatorsByIdMap.get(operatorId);
        if (!operator) {
          return null;
        }

        return {
          id: operator._id || operator.id || operatorId,
          name: this.getOperatorDisplayName(operator),
        };
      })
      .filter(
        (op): op is { id: string; name: string } =>
          !!op && !!op.name
      );
  }

  getAvailableOperators(): any[] {
    if (!Array.isArray(this.allOperatorList) || !this.selectedUser) {
      return this.allOperatorList ?? [];
    }

    const assignedOperatorIds = this.operatorsByUserIdMap.get(this.selectedUser.id) || new Set<string>();

    return this.allOperatorList.filter((operator: any) => {
      const operatorId = operator?._id || operator?.id;
      return operatorId ? !assignedOperatorIds.has(operatorId) : true;
    });
  }

  getOperatorsForDropdown(): any[] {
    const available = this.getAvailableOperators();
    const groupKey = 'All Operators';
    
    // Single group for all operators
    this.availableOperatorsForDropdown = available.map((operator: any) => ({
      id: operator._id || operator.id,
      name: operator.name || operator._id || operator.id,
      group: groupKey
    }));
    
    return this.availableOperatorsForDropdown;
  }

  // Function to group items by their group property
  groupByFn = (item: any) => {
    return item.group || 'All Operators';
  }

  // Check if a group is fully selected
  isGroupSelected(groupName: string): boolean {
    const groupItems = this.availableOperatorsForDropdown.filter(item => item.group === groupName);
    if (groupItems.length === 0) return false;
    return groupItems.every(item => this.selectedOperators.includes(item.id));
  }



  areAllOperatorsAssigned(): boolean {
    if (!this.selectedUser || !Array.isArray(this.allOperatorList) || this.allOperatorList.length === 0) {
      return false;
    }
    return this.getAvailableOperators().length === 0;
  }

 

  addOperator(user: any) {
    if (!user || !user.id) {
      this.toastr.error("Invalid user selected");
      return;
    }
    this.selectedUser = user;
    this.selectedOperators = [];

    // Update dropdown options
    this.getOperatorsForDropdown();
  }

  resetForm() {
    this.selectedOperators = [];
    this.selectedUser = null;
  }

  onSubmit() {
    this.isSubmitted = true;
    if (this.selectedOperators.length === 0) {
      return;
    }

    if (!this.selectedUser || !this.selectedUser.id) {
      this.toastr.error("No user selected");
      return;
    }

    this.loading = true;
    // For each operator, add the user to its userId array
    const updateObservables = this.selectedOperators.map((operatorId: string) => {
      const operator = this.operatorsByIdMap.get(operatorId);
      if (!operator) {
        return of({ success: false, skipped: false, error: `Operator ${operatorId} not found` });
      }
      const currentUserIds = Array.isArray(operator.userId)
        ? operator.userId
        : operator.userId
        ? [operator.userId]
        : [];

      // Check if user is already assigned
      if (currentUserIds.includes(this.selectedUser.id)) {
        return of({ success: true, skipped: true, operatorId });
      }

      const payload = {
        ...operator,
        userId: [...currentUserIds, this.selectedUser.id],
      };
      return this.operatorService
        .updateOperator(payload, operator._id)
        .pipe(
          map((res: any) => ({ ...res, skipped: false, operatorId })),
          catchError((error: any) => of({ success: false, skipped: false, error: error?.error?.detail || error?.message || "Failed to update operator" }))
        );
    });
    forkJoin(updateObservables)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (results: any[]) => {
          const successCount = results.filter(r => r?.success || r?.skipped).length;
          const skippedCount = results.filter(r => r?.skipped).length;
          const actualAssigned = successCount - skippedCount;
          const errors = results.filter(r => !r?.success && !r?.skipped);

          if (errors.length > 0 && errors.length === results.length) {
            // All failed
            this.toastr.error(errors[0]?.error || "Failed to assign operator");
            return;
          }

          if (actualAssigned > 0 || skippedCount > 0) {
            const message = this.selectedOperators.length > 1
              ? `${actualAssigned} operator${actualAssigned !== 1 ? 's' : ''} assigned successfully${skippedCount > 0 ? ` (${skippedCount} already assigned)` : ''}`
              : "Operator assigned successfully";
            this.toastr.success(message);
            this.loadOperatorsAndUser();
            this.closeModal();
            this.isSubmitted = false;
          } else {
            this.toastr.warning("No operators were assigned");
          }
        },
        error: (error: any) => {
          this.toastr.error(error?.error?.detail || error?.message || "Failed to assign operator");
        },
      });
  }

  onUserTypeChange(user: any, event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const selectedValue = selectElement.value;
    this.userLoading = true;
    this.authService.updateUser(user.id, { userType: selectedValue }).pipe(finalize(() => (this.userLoading = false))).subscribe({
      next: (res: any) => {
        if (res.success) {
        this.toastr.success("User type updated successfully");
          this.loadOperatorsAndUser();
        } else {
          this.toastr.error(res.detail.error || "Failed to update user type");
        }
      },
      error: (error: any) => {
        this.toastr.error(error.error.detail.error || "Failed to update user type");
      },
    });
  }

  deleteUser(userId: string) {
    if (!userId) {
      this.toastr.error("Invalid user");
      return;
    }
    this.toastService.showConfirm(
      "Are you sure?",
      "Delete the selected user?",
      "Yes, delete it!",
      "No, cancel",
      () => {
        this.authService
          .deleteUser(userId)
          .pipe(finalize(() => (this.loading = false)))
          .subscribe({
            next: (res: any) => {
              if (res.success) {
                this.toastr.success("User deleted successfully");
                this.loadOperatorsAndUser();
              } else {
                this.toastr.error(res?.detail || res?.error || "Failed to delete user");
              }
            },
            error: (err: any) => {
              this.toastr.error(err?.error?.detail?.error || err?.error?.detail || err?.error?.error || "Failed to delete user");
            },
          });
      },
      () => {
        // Cancel callback
      }
    );
  }

  removeOperator(user: any, operatorId: string) {
    this.toastService.showConfirm(
      "Are you sure?",
      "Remove the selected operator from the user?",
      "Yes, remove it!",
      "No, cancel",
      () => {
        this.operatorService
          .deleteOperatorUser(user.id, operatorId)
          .pipe(finalize(() => (this.loading = false)))
          .subscribe({
            next: (res: any) => {
              if (res.success) {
                this.toastr.success("Operator removed successfully");
                this.loadOperatorsAndUser();
              } else {
                this.toastr.error(res.detail || "Failed to remove operator");
              }
            },
            error: (error: any) => {
              this.toastr.error(error.error.detail || "Failed to remove operator");
              this.loading = false;
            },
          });
      },
      () => {
        // Cancel callback
      }
    );
  }

  private buildOperatorsByIdMap(operators: any[]): Map<string, any> {
    if (!Array.isArray(operators)) {
      return new Map<string, any>();
    }

    return new Map<string, any>(
      operators
        .filter((operator: any) => operator?._id || operator?.id)
        .map((operator: any) => [operator._id || operator.id, operator])
    );
  }

  private buildOperatorsByUserIdMap(operators: any[]): Map<string, Set<string>> {
    const map = new Map<string, Set<string>>();

    if (!Array.isArray(operators)) {
      return map;
    }

    operators.forEach((operator: any) => {
      const operatorId = operator?._id || operator?.id;
      if (!operatorId) {
        return;
      }

      const rawIds = Array.isArray(operator?.userId)
        ? operator.userId
        : operator?.userId
        ? [operator.userId]
        : [];

      const normalizedIds = rawIds
        .map((userIdentifier: any) =>
          typeof userIdentifier === "string"
            ? userIdentifier
            : userIdentifier?._id ?? userIdentifier?.id ?? ""
        )
        .filter((id: any): id is string => typeof id === "string" && !!id);

      normalizedIds.forEach((userId: string) => {
        if (!map.has(userId)) {
          map.set(userId, new Set<string>());
        }
        map.get(userId)!.add(operatorId);
      });
    });

    return map;
  }

  private closeModal() {
    if (this.closeButton && this.closeButton.nativeElement) {
      (this.closeButton.nativeElement as HTMLElement).click();
    }
  }
}

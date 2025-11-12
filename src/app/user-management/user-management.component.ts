import { Component, ElementRef, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { OperatorService } from "../_services/operator.service";
import { ToastrService } from "ngx-toastr";
import { finalize } from "rxjs";
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
  addOperatorForm: FormGroup;
  selectedOperator: any | null = null;
  constructor(
    private operatorService: OperatorService,
    private toastr: ToastrService,
    private fb: FormBuilder,
    private authService: AuthenticationService,
    private toastService: ToastService
  ) {
    this.addOperatorForm = this.fb.group({
      userId: [null, Validators.required],
    });
  }

  ngOnInit() {
    this.loadOperatorsAndUser();
  }

  loadOperatorsAndUser() {
    this.apiLoading = true;
    this.operatorService.getAllOperatorList().subscribe({
      next: (res: any) => {
        this.allOperatorList = res?.data?.operators ?? [];
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

  getUserDisplayName(user: any): string {
    if (!user) {
      return "";
    }

    const fullNameCandidate =
      user.fullName ??
      user.fullname ??
      [user.firstName, user.lastName].filter(Boolean).join(" ");

    const fullName =
      typeof fullNameCandidate === "string" && fullNameCandidate.trim().length
        ? fullNameCandidate.trim()
        : null;

    if (fullName) {
      return fullName;
    }

    if (typeof user.name === "string" && user.name.trim().length) {
      return user.name.trim();
    }

    if (typeof user.email === "string" && user.email.trim().length) {
      return user.email.trim();
    }

    return (user._id ?? user.id ?? "").toString();
  }

  getUsersDetails(userIds: any[]): Array<{ id: string; fullName: string }> {
    if (
      !Array.isArray(userIds) ||
      !userIds.length ||
      !Array.isArray(this.allUsersList)
    ) {
      return [];
    }

    const usersMap = new Map(
      this.allUsersList
        .filter((user: any) => user?._id || user?.id)
        .map((user: any) => [user._id ?? user.id, user])
    );

    return userIds
      .map((userIdentifier: any) => {
        const lookupKey =
          typeof userIdentifier === "string"
            ? userIdentifier
            : userIdentifier?._id ?? userIdentifier?.id;

        if (!lookupKey) {
          return null;
        }

        const user = usersMap.get(lookupKey);

        if (!user) {
          return null;
        }

        const fullName = this.getUserDisplayName(user);

        return {
          id: user._id ?? user.id ?? lookupKey,
          fullName,
        };
      })
      .filter(
        (user): user is { id: string; fullName: string } =>
          !!user && !!user.fullName
      );
  }

  getAvailableUsers(): any[] {
    if (!Array.isArray(this.allUsersList) || !this.selectedOperator) {
      return this.allUsersList ?? [];
    }

    const assignedUserIds = this.getAssignedUserIdSet(this.selectedOperator);

    return this.allUsersList.filter((user: any) => {
      const userId = user?._id ?? user?.id;
      return userId ? !assignedUserIds.has(userId) : true;
    });
  }

  hasError(controlName: string) {
    const control = this.addOperatorForm.get(controlName);
    return control?.invalid && control?.touched;
  }

  addUser(operator: any) {
    if (!operator || !operator._id) {
      this.toastr.error("Invalid operator selected");
      return;
    }

    this.addOperatorForm.reset({
      userId: null,
    });

    this.selectedOperator = operator;
  }

  resetForm() {
    this.addOperatorForm.reset({
      userId: null,
    });
    this.selectedOperator = null;
  }

  onSubmit() {
    this.addOperatorForm.markAllAsTouched();

    if (this.addOperatorForm.invalid) {
      return;
    }

    if (!this.selectedOperator || !this.selectedOperator._id) {
      this.toastr.error("No operator selected");
      return;
    }

    this.loading = true;

    const selectedUserId: string | null =
      this.addOperatorForm.value.userId ?? null;

    if (!selectedUserId) {
      this.toastr.error("Please select a user");
      this.loading = false;
      return;
    }

   
    const payload = {
      ...this.selectedOperator,
      userId: [...this.selectedOperator.userId, selectedUserId],
    };

    this.operatorService
      .updateOperator(payload, this.selectedOperator._id)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            this.toastr.success("User assigned successfully");
            this.loadOperatorsAndUser();
            this.closeModal();
          } else {
            this.toastr.error(res.detail || "Failed to assign user");
          }
        },
        error: (error: any) => {
          this.toastr.error(error.error.detail || "Failed to assign user");
          this.loading = false;
        },
      });
  }

  removeUser(operator: any, userId: string) {
    this.toastService.showConfirm(
      "Are you sure?",
      "Remove the selected user from the operator?",
      "Yes, remove it!",
      "No, cancel",
      () => {
        this.operatorService
          .deleteOperatorUser(userId, operator._id)
          .pipe(finalize(() => (this.loading = false)))
          .subscribe({
            next: (res: any) => {
              if (res.success) {
                this.toastr.success("User removed successfully");
                this.loadOperatorsAndUser();
              } else {
                this.toastr.error(res.detail || "Failed to remove user");
              }
            },
            error: (error: any) => {
              this.toastr.error(error.error.detail || "Failed to remove user");
              this.loading = false;
            },
          });
      },
      () => {
        // Cancel callback
      }
    );
  }

  private getAssignedUserIdSet(operator: any): Set<string> {
    if (!operator) {
      return new Set<string>();
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

    return new Set<string>(normalizedIds);
  }

  private closeModal() {
    if (this.closeButton && this.closeButton.nativeElement) {
      (this.closeButton.nativeElement as HTMLElement).click();
    }
  }
}

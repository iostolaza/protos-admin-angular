
/* Edited payment card. */

import { Component, effect, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService, UserProfile } from '../../core/services/user.service';

@Component({
  selector: 'app-payment-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bg-card text-card-foreground p-6 rounded-lg shadow-custom border border-border flex flex-col h-full">
      <h2 class="text-xl font-bold mb-4 text-primary">Payment Methods</h2>
      @if (editMode()) {
        <form [formGroup]="form" (ngSubmit)="save()">
          <div formArrayName="paymentMethods">
            @for (method of paymentMethods.controls; track $index) {
              <div class="grid grid-cols-2 gap-4 mb-4" [formGroupName]="$index">
                <div>
                  <label class="block text-sm text-muted-foreground">Type</label>
                  <input formControlName="type" class="w-full p-2 border border-border rounded bg-background text-foreground" />
                </div>
                <div>
                  <label class="block text-sm text-muted-foreground">Name</label>
                  <input formControlName="name" class="w-full p-2 border border-border rounded bg-background text-foreground" />
                </div>
                <button type="button" (click)="removeMethod($index)" class="px-2 py-1 bg-destructive text-destructive-foreground rounded">Remove</button>
              </div>
            }
          </div>
          <button type="button" (click)="addMethod()" class="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-muted">Add Method</button>
          <div class="mt-4 flex justify-end gap-2">
            <button type="button" (click)="toggleEdit()" class="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-muted">Cancel</button>
            <button type="submit" class="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">Save</button>
          </div>
        </form>
      } @else {
        <div class="grid grid-cols-2 gap-4 text-foreground">
          @for (method of paymentMethodsList(); track $index) {
            <div><strong class="text-muted-foreground">{{ method.type }}:</strong> <span class="text-foreground">{{ method.name }}</span></div>
          }
        </div>
        <button (click)="toggleEdit()" class="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">Edit</button>
      }
    </div>
  `,
})

export class PaymentCardComponent {
  editMode = signal(false);
  form: FormGroup;
  user: UserProfile | null = null;
  paymentMethodsList = signal<Array<{ id: string; type: string; name: string }>>([]);

  constructor(private fb: FormBuilder, private userService: UserService) {
    this.form = this.fb.group({
      paymentMethods: this.fb.array([]),
    });
    effect(() => {
      const u = this.userService.user$();
      this.user = u;
      this.loadPayments();
    });
  }

  async loadPayments() {
    const payments = await this.userService.getPaymentMethods();
    this.paymentMethodsList.set(payments);
    if (this.editMode()) {
      this.populateMethods(payments);
    }
  }

  get paymentMethods(): FormArray {
    return this.form.get('paymentMethods') as FormArray;
  }

  populateMethods(methods: Array<{ id: string; type: string; name: string }>) {
    this.paymentMethods.clear();
    methods.forEach(m => {
      this.paymentMethods.push(this.fb.group({
        id: [m.id],
        type: [m.type],
        name: [m.name],
      }));
    });
  }

  addMethod() {
    this.paymentMethods.push(this.fb.group({
      id: [null],
      type: [''],
      name: [''],
    }));
  }

  removeMethod(index: number) {
    this.paymentMethods.removeAt(index);
  }

  toggleEdit() {
    this.editMode.update(m => !m);
    if (this.editMode()) {
      this.populateMethods(this.paymentMethodsList());
    }
  }

  async save() {
    if (this.form.valid && this.user) {
      const originalIds = new Set(this.paymentMethodsList().map(m => m.id));
      const newMethods = this.form.value.paymentMethods;
      const newIds = new Set(newMethods.filter((m: any) => m.id).map((m: any) => m.id));

      // Delete removed methods
      for (const id of originalIds) {
        if (!newIds.has(id)) {
          await this.userService.deletePaymentMethod(id);
        }
      }

      // Update or add methods
      for (const method of newMethods) {
        if (method.id) {
          await this.userService.updatePaymentMethod(method.id, method.type, method.name);
        } else {
          await this.userService.addPaymentMethod(method.type, method.name);
        }
      }

      await this.loadPayments();
      this.toggleEdit();
    }
  }
}

/* Edited payment card. */

import { Component, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService, User } from '../../core/services/user.service';

@Component({
  selector: 'app-payment-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bg-card text-card-foreground p-6 rounded-lg shadow-custom">
      <h2 class="text-lg font-semibold mb-4 text-foreground">Payment Methods</h2>
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
          @for (method of user?.paymentMethods; track $index) {
            <div><strong>{{ method.type }}:</strong> {{ method.name }}</div>
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
  user: User | null = null;

  constructor(private fb: FormBuilder, private userService: UserService) {
    this.form = this.fb.group({
      paymentMethods: this.fb.array([]),
    });
    this.userService.user$.subscribe(u => {
      this.user = u;
      this.populateMethods(u?.paymentMethods || []);
    });
  }

  get paymentMethods(): FormArray {
    return this.form.get('paymentMethods') as FormArray;
  }

  populateMethods(methods: Array<{ type: string; name: string }>) {
    this.paymentMethods.clear();
    methods.forEach(m => {
      this.paymentMethods.push(this.fb.group({
        type: [m.type],
        name: [m.name],
      }));
    });
  }

  addMethod() {
    this.paymentMethods.push(this.fb.group({
      type: [''],
      name: [''],
    }));
  }

  toggleEdit() {
    this.editMode.update(m => !m);
  }

  save() {
    if (this.form.valid && this.user) {
      const updated = { ...this.user, paymentMethods: this.form.value.paymentMethods };
      this.userService.save(updated);
      this.toggleEdit();
    }
  }
}
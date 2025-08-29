/* Edited payment card. */
 
import { Component, effect, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService, UserProfile } from '../../core/services/user.service';
 
@Component({
  selector: 'app-payment-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './payment-card.component.html',
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
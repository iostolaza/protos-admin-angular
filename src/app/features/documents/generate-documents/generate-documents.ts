// src/app/features/documents/generate-documents/generate-documents.ts (Fixed templateUrl to match file name)

import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DocumentService } from '../../../core/services/document.service';
import { signal } from '@angular/core';
import { getCurrentUser } from 'aws-amplify/auth';

@Component({
  selector: 'app-generate-documents',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './generate-documents.html', 
})
export class GenerateDocumentsComponent {
  form: FormGroup;
  file: File | null = null;
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  constructor(private fb: FormBuilder, private documentService: DocumentService) {
    this.form = this.fb.group({
      category: ['', Validators.required],
      description: [''],
    });
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.file = input.files[0];
  }

  async submit() {
    if (!this.file || this.form.invalid) return;
    try {
      const { userId } = await getCurrentUser();
      const docData = {
        userCognitoId: userId,
        category: this.form.value.category,
        description: this.form.value.description,
      };
      this.documentService.uploadDocument(docData, this.file).subscribe({
        next: () => {
          this.successMessage.set('Document uploaded successfully!');
          this.form.reset();
          this.file = null;
        },
        error: (err) => this.errorMessage.set(err.message),
      });
    } catch (err) {
      this.errorMessage.set((err as Error).message);
    }
  }
}
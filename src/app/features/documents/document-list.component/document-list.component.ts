// src/app/features/documents/document-list.component/document-list.component.ts (Added AngularSvgIconModule to imports)

import { Component, EventEmitter, Output } from '@angular/core';  // Added Output
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';  
import { AngularSvgIconModule } from 'angular-svg-icon';
import { getIconPath } from '../../../core/services/icon-preloader.service';
import { DocumentService } from '../../../core/services/document.service';
import { signal, computed } from '@angular/core';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule, FormsModule, AngularSvgIconModule],
  templateUrl: './document-list.component.html',
})
export class DocumentListComponent {
  @Output() filterCategory = new EventEmitter<string>();
  documents = signal<any[]>([]);
  searchTerm = signal<string>('');
  selectedCategory = signal<string>('');

  getIconPath = getIconPath;

  filteredDocuments = computed(() => 
    this.documents().filter(d => 
      (!this.selectedCategory() || d.category === this.selectedCategory()) &&
      (d.fileName.toLowerCase().includes(this.searchTerm().toLowerCase()) || d.description?.toLowerCase().includes(this.searchTerm().toLowerCase()))
    )
  );

  constructor(private documentService: DocumentService) {
    this.documentService.listDocuments().subscribe(docs => this.documents.set(docs));
  }

  onFilterChange() {
    this.filterCategory.emit(this.selectedCategory());
  }

  onDelete(id: string, fileKey: string) {
    this.documentService.deleteDocument(id, fileKey).subscribe(() => {
      this.documents.update(docs => docs.filter(d => d.id !== id));
    });
  }
}
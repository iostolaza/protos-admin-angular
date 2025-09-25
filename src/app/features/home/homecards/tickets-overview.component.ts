// src/app/features/home/homecards/tickets-overview.component.ts

import { Component, inject, OnInit, signal, afterNextRender, AfterViewInit, effect } from '@angular/core';
import { TicketService } from '../../../core/services/ticket.service';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { getIconPath } from '../../../core/services/icon-preloader.service';
import { Router } from '@angular/router';
import { FlatTicket, TicketStatus } from '../../../core/models/tickets.model';
import { CommonModule } from '@angular/common'; 
import { StatusClassPipe } from '../../../core/pipes/status-class.pipe';

declare var p5: any;
declare global {
  interface Window {
    p5: {
      new (sketch: (p: any) => void, node?: string | HTMLElement): any; // Updated constructor signature for instance mode with container
      prototype: {
        setup: () => void;
        draw: () => void;
        windowResized: () => void;
        createCanvas: (width: number, height: number) => void;
        resizeCanvas: (width: number, height: number) => void;
        noLoop: () => void;
        redraw: () => void;
        fill: (color: string) => void;
        arc: (x: number, y: number, w: number, h: number, start: number, stop: number) => void;
        ellipse: (x: number, y: number, w: number, h: number) => void;
        textAlign: (hAlign: string, vAlign: string) => void;
        textSize: (size: number) => void;
        text: (str: string, x: number, y: number) => void;
        TWO_PI: number;
        CENTER: string;
        background: (color: number) => void;
      };
    };
  }
}

@Component({
  selector: 'app-tickets-overview',
  standalone: true,
  imports: [AngularSvgIconModule, CommonModule, StatusClassPipe],
  template: `
    <div class="rounded-lg bg-card w-full h-full px-4 py-6 flex flex-col justify-between">
      <div>
        <h3 class="text-lg font-bold uppercase text-left text-blue-500 dark:text-blue-300">Tickets</h3>
        <div class="mt-6 flex items-center">
          <div id="ticketsPieChart" class="w-full h-48"></div>
          <div class="ml-4">
            <div *ngFor="let label of pieLabels(); let i = index" class="flex items-center mb-1">
              <div class="w-3 h-3 rounded-full" [style.background-color]="colors()[i]"></div>
              <p class="ml-2 text-sm text-gray-200">{{ label }}</p>
            </div>
          </div>
        </div>
        <div class="mt-6">
          <div *ngFor="let ticket of ticketsPreview()" class="bg-gray-600 p-2 rounded-lg flex items-center space-x-2 w-full mt-2">
            <span [ngClass]="ticket.status | statusClass" class="rounded-full px-2 py-1 text-white">{{ ticket.status }}</span>
            <div class="flex-1">
              <p class="text-sm text-white">{{ ticket.title }}</p>
              <p class="text-xs text-gray-200">{{ ticket.updatedAt | date:'yyyy-MM-dd' }}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="flex justify-end mt-4">
        <button (click)="navigateToTickets()">
          <svg-icon [src]="getIconPath('arrow-right')" class="h-5 w-5 text-gray-500"></svg-icon>
        </button>
      </div>
    </div>
  `,
})
export class TicketsOverviewComponent implements OnInit {
  private ticketService = inject(TicketService);
  private router = inject(Router);

  tickets = signal<FlatTicket[]>([]);
  ticketsPreview = signal<FlatTicket[]>([]);
  pieLabels = signal<string[]>([]);
  pieData = signal<number[]>([]);
  colors = signal<string[]>(['#4285F4', '#0F9D58', '#DB4437']);
  total = signal(0);

  getIconPath = getIconPath;

  private p5Instance: any; // Reference to p5 instance for cleanup/redraw

  constructor() {
    afterNextRender(() => {
      this.initP5Chart();
    });

    // Effect for reactive redraw on data change
    effect(() => {
      this.pieData(); // Track signal
      if (this.p5Instance) {
        this.p5Instance.redraw();
      }
    });
  }

  async ngOnInit() {
    console.log(window.p5); // Verify p5 load
    const { tickets } = await this.ticketService.getTickets();
    this.tickets.set(tickets);
    this.updatePreviewAndChart();
  }

  private initP5Chart() {
    this.p5Instance = new window.p5((sketch: any) => {
      sketch.setup = () => {
        const container = document.getElementById('ticketsPieChart');
        if (container) {
          const width = container.clientWidth;
          const height = container.clientHeight;
          sketch.createCanvas(width, height);
        } else {
          sketch.createCanvas(200, 200); // Fallback
        }
        sketch.noLoop();
      };

      sketch.draw = () => {
        const width = sketch.width;
        const height = sketch.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const diameter = Math.min(width, height) * 0.8;
        sketch.background(255);
        let lastAngle = 0;
        const colors = this.colors();
        this.pieData().forEach((value, i) => {
          if (value > 0) {
            const angle = (value / this.total()) * sketch.TWO_PI;
            sketch.fill(colors[i % colors.length]);
            sketch.arc(centerX, centerY, diameter, diameter, lastAngle, lastAngle + angle);
            lastAngle += angle;
          }
        });
        sketch.fill(255);
        sketch.ellipse(centerX, centerY, diameter * 0.6, diameter * 0.6);
        sketch.fill(0);
        sketch.textAlign(sketch.CENTER, sketch.CENTER);
        sketch.textSize(32);
        sketch.text(this.total(), centerX, centerY - 10);
        sketch.textSize(16);
        sketch.text('tickets', centerX, centerY + 10);
      };

      sketch.windowResized = () => {
        const container = document.getElementById('ticketsPieChart');
        if (container) {
          const width = container.clientWidth;
          const height = container.clientHeight;
          sketch.resizeCanvas(width, height);
          sketch.redraw();
        }
      };
    }, 'ticketsPieChart'); // Pass container ID for proper attachment
  }

  private updatePreviewAndChart() {
    const tickets = this.tickets();
    interface TicketStatusSubset {
      [TicketStatus.OPEN]: number;
      [TicketStatus.IN_PROGRESS]: number;
      [TicketStatus.CLOSED]: number;
    }
    const statusCount: TicketStatusSubset = {
      [TicketStatus.OPEN]: 0,
      [TicketStatus.IN_PROGRESS]: 0,
      [TicketStatus.CLOSED]: 0,
    };
    tickets.forEach(ticket => {
      switch (ticket.status) {
        case TicketStatus.OPEN:
          statusCount[TicketStatus.OPEN]++;
          break;
        case TicketStatus.IN_PROGRESS:
          statusCount[TicketStatus.IN_PROGRESS]++;
          break;
        case TicketStatus.CLOSED:
          statusCount[TicketStatus.CLOSED]++;
          break;
      }
    });
    const total = Object.values(statusCount).reduce((a, b) => a + b, 0) || tickets.length || 1;
    this.total.set(total);
    this.pieData.set([
      statusCount[TicketStatus.OPEN],
      statusCount[TicketStatus.IN_PROGRESS],
      statusCount[TicketStatus.CLOSED],
    ]);
    this.pieLabels.set([
      TicketStatus.OPEN,
      TicketStatus.IN_PROGRESS,
      TicketStatus.CLOSED,
    ]);
    this.ticketsPreview.set(tickets.slice(0, 3));
    console.log(this.pieData()); // Check Data
  }

  navigateToTickets() {
    this.router.navigate(['/main-layout/ticket-management/tickets']);
  }
}
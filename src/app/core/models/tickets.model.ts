
// src/app/core/models/tickets.model.ts

import { InputContact as User } from './contact';
 
export interface Ticket {
  id: string;
  title: string;
  description: string;
  labels?: string[];
  status: 'OPEN' | 'QUEUED' | 'IN_PROGRESS' | 'COMPLETE' | 'CLOSED' | 'REOPENED';
  estimated: Date;
  createdAt: Date;
  updatedAt?: Date;
  startDate?: Date;
  completionDate?: Date;
  requesterId: string;
  requester?: User;
  assigneeId?: string;
  assignee?: User;
  teamId: string;
  team?: Team;
  attachments?: string[];
  comments?: Comment[];
}
 
export interface Team {
  id: string;
  name: string;
  description?: string;
  teamLeadId: string;
  teamLead?: User;
  members?: TeamMember[];
  tickets?: Ticket[];
}
 
export interface TeamMember {
  teamId: string;
  userId: string;
  team?: Team;
  user?: User;
}
 
export interface Comment {
  content: string;
  createdAt: Date;
  userId: string;
  user?: User;
  ticketId: string;
  ticket?: Ticket;
}
 
export interface Notification {
  content: string;
  createdAt: Date;
  type: 'team' | 'ticket' | 'viewTeam';
  nameType?: string;
  userId: string;
  user?: User;
  isRead: boolean;
}
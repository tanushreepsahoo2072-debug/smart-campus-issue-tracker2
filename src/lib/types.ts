import type { Timestamp } from 'firebase/firestore';

export type IssueCategory = 'Maintenance' | 'Safety' | 'IT Support' | 'Landscaping' | 'Facilities' | 'Other' | 'Electrical' | 'Plumbing';
export type IssueStatus = 'Open' | 'In Progress' | 'Resolved' | 'Denied' | 'Denied by AI';
export type AIPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export interface AIAnalysis {
  ai_priority: AIPriority;
  ai_spam_score: number;
}

export interface AIAnalysisPlus extends AIAnalysis {
  is_spam: boolean;
  spam_reason: string;
}

export interface Issue extends AIAnalysisPlus {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  longitude:number ;
  latitude: number;
  imageUrl?: string;
  assignedTo?: string;
  timestamp: Timestamp | string; // Can be a server timestamp on write, string on read
  createdAt: Timestamp | string; 
  updatedAt?: Timestamp | string; 
  currentStatus: IssueStatus;
  frequency: number;
  predicted_resolution_time?: string; 
  admin_comments?: string;
}

export type UserRole = 'user' | 'admin' | 'authority';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
}

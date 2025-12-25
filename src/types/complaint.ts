import type { Timestamp } from 'firebase/firestore';
export type IssueCategory = 'Maintenance' | 'Safety' | 'IT Support' | 'Landscaping' | 'Facilities' | 'Other' | 'Electrical' | 'Plumbing';
export type IssueStatus = 'Open' | 'In Progress' | 'Resolved' | 'Denied' | 'Denied by AI';
export type Complaint = {
  id: string;
  title: string;
  description: string;
  longitude:number;
  latitude: number;
  email: string;
  imageUrls: string[];
  category: IssueCategory;
  priority: 'Not-Assigned' | 'Low' | 'Medium' | 'High' | 'Critical';
  currentStatus: IssueStatus;
  assignedTo: string;
  timestamp: Timestamp | string; // Can be a server timestamp on write, string on read
  frequency: number;
  createdAt: string // ISO string
  updatedAt: Timestamp | string; // ISO string
  predicted_resolution_time: string;
  admin_comments: string;
  ai_priority: 'Low' | 'Medium' | 'High' | 'Critical';
  ai_spam_score: number;
  is_spam: boolean;
  spam_reason: string;
  AI: number;
};

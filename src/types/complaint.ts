import type { Timestamp } from 'firebase/firestore';
export type IssueCategory = 'Maintenance' | 'Safety' | 'IT Support' | 'Landscaping' | 'Facilities' | 'Other' | 'Electrical' | 'Plumbing';
export type IssueStatus = 'Open' | 'In Progress' | 'Resolved' | 'Denied' | 'Denied by AI';
export type AIPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type Complaint = {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  email: string;
  imageUrls: string[];
  admin_comments: string;
  category: IssueCategory;
  currentStatus: IssueStatus;
  assignedTo: string;
  timestamp: Timestamp | string; // Can be a server timestamp on write, string on read
  frequency: number;
  createdAt: string // ISO string
  updatedAt:  string; // ISO string
  predicted_resolution_time: string;
  ai_spam_score: number;
  is_spam: boolean;
  AI: number; // 0: pending, 1: complete, -1: error
  AI_COMMENT: string;
  merged_into: string | null;
  ai_priority?: AIPriority;
};
export type Issue = {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  email: string;
  imageUrls: string[];
  admin_comments: string;
  category: IssueCategory;
  currentStatus: IssueStatus;
  assignedTo: string;
  timestamp: Timestamp | string; // Can be a server timestamp on write, string on read
  frequency: number;
  createdAt: string // ISO string
  updatedAt:  string; // ISO string
  predicted_resolution_time: string;
  ai_spam_score: number;
  is_spam: boolean;
  AI: number; // 0: pending, 1: complete, -1: error
  AI_COMMENT: string;
  merged_into: string | null;
  ai_priority?: AIPriority;
};

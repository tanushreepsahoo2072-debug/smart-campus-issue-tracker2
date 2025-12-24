
export type Complaint = {
  id: string;
  title: string;
  description: string;
  location: string;
  email: string;
  createdBy: string;
  imageUrls: string[];
  category: 'Maintenance' | 'Safety' | 'IT Support' | 'Landscaping' | 'Facilities' | 'Other' | 'Electrical' | 'Plumbing' | '';
  priority: 'Not-Assigned' | 'Low' | 'Medium' | 'High' | 'Critical';
  currentStatus: 'Open' | 'In Progress' | 'Resolved' | 'Denied' | 'Pending';
  assignedTo: string;
  frequency: number;
  createdAt: string; // ISO string
  updatedAt: string | null; // ISO string
  admin_comments: string;
  is_spam: boolean;
  AI: number; // 0: pending, 1: complete, -1: error
  AI_COMMENT: string;
  merged_into: string | null;
  ai_priority?: 'Not-Assigned' | 'Low' | 'Medium' | 'High' | 'Critical';
};

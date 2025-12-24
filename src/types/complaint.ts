
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
  status: 'Open' | 'In Progress' | 'Resolved' | 'Denied' | 'Pending';
  assignedTo: string;
  frequency: number;
  createdAt: string; // ISO string
  updatedAt: string | null; // ISO string
  admin_comments: string;
  is_spam: boolean; // Note: You've described this as 'is_duplicate' in logic, using is_spam as it's in the schema.
  AI: number;
  AI_COMMENT: string;
  merged_into: string | null;

  // These fields are from the old schema and will be phased out or adapted.
  currentStatus?: 'Open' | 'In Progress' | 'Resolved' | 'Denied' | 'Pending';
  ai_priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  ai_spam_score?: string;
  spam_reason?: string;
  predicted_resolution_time?: string;
};

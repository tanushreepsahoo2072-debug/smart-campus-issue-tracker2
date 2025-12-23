
export type Complaint = {
  id: string;
  title: string;
  description: string;
  location: string;
  email: string;
  createdBy: string;
  imageUrls: string[];
  category: string;
  priority: 'Not-Assigned' | 'Low' | 'Medium' | 'High' | 'Critical';
  currentStatus: 'Open' | 'In Progress' | 'Resolved' | 'Denied' | 'Pending';
  assignedTo: string;
  frequency: string;
  createdAt: string; // ISO string
  updatedAt: string | null; // ISO string
  predicted_resolution_time: string;
  admin_comments: string;
  ai_priority: 'Low' | 'Medium' | 'High' | 'Critical';
  ai_spam_score: string;
  is_spam: boolean;
  spam_reason: string;
  AI: number;
};

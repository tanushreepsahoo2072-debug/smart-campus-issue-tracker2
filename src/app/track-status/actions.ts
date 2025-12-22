
'use server';

import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

const { firestore } = initializeFirebase();

export type ComplaintDetails = {
  id: string;
  title: string;
  description: string;
  ai_priority: 'Critical' | 'High' | 'Medium' | 'Low';
  currentStatus: 'Open' | 'In Progress' | 'Resolved' | 'Denied';
  admin_comments?: string;
  imageUrls: string[];
  createdAt: string; // ISO string
  updatedAt?: string; // ISO string
  AI: number;
};

type FetchResult = {
  status: 'success' | 'not-found' | 'error' | 'processing';
  data?: ComplaintDetails;
  error?: string;
};

function formatTimestamp(timestamp: any): string {
    if (!timestamp) return '';
    if (timestamp instanceof Timestamp) {
        return timestamp.toDate().toISOString();
    }
    if (timestamp._seconds) { // Handle plain object format from Firestore
        return new Date(timestamp._seconds * 1000).toISOString();
    }
    return new Date(timestamp).toISOString();
}

function formatUpdateTimestamp(timestamp: any): string {
    if (!timestamp) return '';
    const date = (timestamp instanceof Timestamp) ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    return `Updated ${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}


export async function fetchComplaintById(id: string): Promise<FetchResult> {
  if (!id) {
    return { status: 'error', error: 'Track ID is required.' };
  }

  try {
    const docRef = doc(firestore, 'issues', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { status: 'not-found' };
    }

    const data = docSnap.data();
    
    // If AI processing is not done, return a special status
    if (data.AI !== 1) {
      return { status: 'processing' };
    }

    const complaintData: ComplaintDetails = {
      id: docSnap.id,
      title: data.title || 'No Title',
      description: data.description || 'No Description',
      ai_priority: data.ai_priority || 'Low',
      currentStatus: data.currentStatus || 'Open',
      admin_comments: data.admin_comments || '',
      imageUrls: data.imageUrls || [],
      createdAt: data.createdAt ? formatTimestamp(data.createdAt) : '',
      updatedAt: data.updatedAt ? formatUpdateTimestamp(data.updatedAt) : '',
      AI: data.AI || 0,
    };

    return { status: 'success', data: complaintData };
  } catch (error) {
    console.error('Error fetching complaint from Firestore:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    return {
      status: 'error',
      error: `Failed to fetch complaint status: ${errorMessage}`,
    };
  }
}


'use server';

import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

const { firestore } = initializeFirebase();

export type ComplaintDetails = {
  id: string;
  title: string;
  description: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low' | 'Not-Assigned';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Denied';
  admin_comments?: string;
  imageUrls: string[];
  createdAt: string; // ISO string
  updatedAt?: string; // ISO string
  AI: number;
  is_spam: boolean;
  merged_into: string | null;
  AI_COMMENT: string;
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
    // Handle plain object format from Firestore, which can happen with server actions
    if (timestamp._seconds) { 
        return new Date(timestamp._seconds * 1000).toISOString();
    }
    // Fallback for string dates
    return new Date(timestamp).toISOString();
}

function formatUpdateTimestamp(timestamp: any): string | undefined {
    if (!timestamp) return undefined;
    const date = (timestamp instanceof Timestamp) ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date.getTime())) return undefined;
    return `Updated ${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

async function fetchComplaintData(id: string): Promise<any> {
    const docRef = doc(firestore, 'issues', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
        return null;
    }
    return { id: docSnap.id, ...docSnap.data() };
}

export async function fetchComplaintById(id: string): Promise<FetchResult> {
  if (!id) {
    return { status: 'error', error: 'Track ID is required.' };
  }

  try {
    let originalData = await fetchComplaintData(id);

    if (!originalData) {
      return { status: 'not-found' };
    }
    
    // If AI processing is not done, return a special status
    if (originalData.AI !== 1) {
      return { status: 'processing' };
    }

    let displayData = originalData;

    // If it's a duplicate, fetch the data from the original issue
    if (originalData.is_spam === true && originalData.merged_into) {
        const mergedData = await fetchComplaintData(originalData.merged_into);
        if (mergedData) {
            // Combine original submission details with the status of the main issue
            displayData = {
                ...originalData, // Keep original title, desc, images
                status: mergedData.status,
                priority: mergedData.priority,
                admin_comments: mergedData.admin_comments,
                updatedAt: mergedData.updatedAt,
            };
        }
    }

    const complaintDetails: ComplaintDetails = {
      id: displayData.id,
      title: displayData.title || 'No Title',
      description: displayData.description || 'No Description',
      priority: displayData.priority || 'Not-Assigned',
      status: displayData.status || 'Open',
      admin_comments: displayData.admin_comments || '',
      imageUrls: displayData.imageUrls || [],
      createdAt: displayData.createdAt ? formatTimestamp(displayData.createdAt) : '',
      updatedAt: displayData.updatedAt ? formatUpdateTimestamp(displayData.updatedAt) : undefined,
      AI: displayData.AI || 0,
      is_spam: originalData.is_spam, // Always reflect original spam status
      merged_into: originalData.merged_into,
      AI_COMMENT: originalData.AI_COMMENT || '',
    };

    return { status: 'success', data: complaintDetails };
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


'use server';

import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { Complaint } from '@/types/complaint';

const { firestore } = initializeFirebase();

export type ComplaintDetails = Complaint;

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
    if (timestamp._seconds) { 
        return new Date(timestamp._seconds * 1000).toISOString();
    }
    return new Date(timestamp).toISOString();
}

function formatUpdateTimestamp(timestamp: any): string | undefined {
    if (!timestamp) return undefined;
    const date = (timestamp instanceof Timestamp) ? timestamp.toDate() : (timestamp._seconds ? new Date(timestamp._seconds * 1000) : new Date(timestamp));
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
    if (originalData.AI === 0) {
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
                currentStatus: mergedData.currentStatus,
                ai_priority: mergedData.ai_priority,
                admin_comments: mergedData.admin_comments,
                updatedAt: mergedData.updatedAt,
            };
        }
    }

    const complaintDetails: ComplaintDetails = {
      id: displayData.id,
      title: displayData.title || 'No Title',
      description: displayData.description || 'No Description',
      latitude: displayData.latitude || 0,
      longitude: displayData.longitude || 0,
      email: displayData.email || '',
      imageUrls: displayData.imageUrls || [],
      category: displayData.category || '',
      currentStatus: displayData.currentStatus || 'Pending',
      assignedTo: displayData.assignedTo || '',
      frequency: displayData.frequency || 1,
      createdAt: displayData.createdAt ? formatTimestamp(displayData.createdAt) : '',
      updatedAt: displayData.updatedAt ? formatUpdateTimestamp(displayData.updatedAt) : null,
      admin_comments: displayData.admin_comments || '',
      is_spam: originalData.is_spam, // Always reflect original spam status
      AI: displayData.AI || 0,
      AI_COMMENT: originalData.AI_COMMENT || '',
      merged_into: originalData.merged_into,
      ai_priority: displayData.ai_priority || 'Not-Assigned',
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

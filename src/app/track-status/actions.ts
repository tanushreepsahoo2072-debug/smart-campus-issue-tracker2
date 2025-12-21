'use server';

import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

const { firestore } = initializeFirebase();

type Complaint = {
  issueId: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  submittedOn: string; // ISO string
  assignedTo: string;
  lastUpdate: string; // ISO string
  notes: string;
};

type FetchResult = {
  status: 'success' | 'not-found' | 'error';
  data?: Complaint[];
  error?: string;
};

function formatTimestamp(timestamp: Timestamp | Date): string {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  return timestamp.toISOString();
}


export async function fetchUserComplaints(email: string): Promise<FetchResult> {
  if (!email) {
    return { status: 'error', error: 'Email is required to fetch complaints.' };
  }

  try {
    const complaintsRef = collection(firestore, 'complaints');
    const q = query(complaintsRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { status: 'not-found' };
    }

    const complaints: Complaint[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      complaints.push({
        issueId: doc.id,
        title: data.title || 'No Title',
        category: data.category || 'Uncategorized',
        priority: data.priority || 'Normal',
        status: data.status || 'Unknown',
        submittedOn: data.timestamp ? formatTimestamp(data.timestamp) : new Date().toISOString(),
        assignedTo: data.assignedTo || 'Unassigned',
        lastUpdate: data.timestamp ? formatTimestamp(data.timestamp) : new Date().toISOString(), // Placeholder
        notes: data.notes || 'No notes yet.',
      });
    });

    return { status: 'success', data: complaints };
  } catch (error) {
    console.error('Error fetching complaints from Firestore:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    return {
      status: 'error',
      error: `Failed to fetch complaint status: ${errorMessage}`,
    };
  }
}

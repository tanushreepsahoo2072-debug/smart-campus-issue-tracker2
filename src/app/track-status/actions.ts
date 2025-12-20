'use server';

// IMPORTANT: Replace with your deployed Google Apps Script URL
const GOOGLE_APP_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbz2FRXSJu8WziHyuc7pDOtALFrRgRVyf0MC-vZiBxwMBN65CmRtEhVaKP0hACM60Zbkgg/exec';

type Complaint = {
  issueId: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  submittedOn: string;
  assignedTo: string;
  lastUpdate: string;
  notes: string;
};

type FetchResult = {
  status: 'success' | 'not-found' | 'error';
  data?: Complaint[];
  error?: string;
};

export async function fetchUserComplaints(email: string): Promise<FetchResult> {
  if (
    GOOGLE_APP_SCRIPT_URL.includes('YOUR_SCRIPT_ID') ||
    GOOGLE_APP_SCRIPT_URL ===
      'https://script.google.com/macros/s/AKfycbw_y8j-a4q9pYx6aL4G2R3e1b7c8d9e0f1g2h3i4j5k6l7m8n9o0p/exec'
  ) {
    console.warn('Google Apps Script URL is not configured.');
    return {
      status: 'error',
      error: 'Google Apps Script URL is not configured. Complaint tracking is disabled.',
    };
  }

  try {
    const response = await fetch(`${GOOGLE_APP_SCRIPT_URL}?email=${email}`, {
      method: 'GET',
      cache: 'no-store',
      redirect: 'follow', // Important for Google Apps Script redirects
    });

    if (!response.ok) {
      throw new Error(`Network response was not ok, status: ${response.status}`);
    }

    const result = await response.json();

    if (result.status === 'success' && Array.isArray(result.data)) {
      const fetchedComplaints: Complaint[] = result.data.map(
        (item: any) =>
          ({
            issueId: item.IssueID,
            title: item.Title,
            category: item.Category,
            priority: item.Priority,
            status: item.Status,
            submittedOn: item.Timestamp,
            assignedTo: item.AssignedTo || 'Unassigned',
            lastUpdate: item.Timestamp, // Placeholder
            notes: item.Notes || 'No notes yet.',
          } as Complaint)
      );
      return {
        status: fetchedComplaints.length > 0 ? 'success' : 'not-found',
        data: fetchedComplaints,
      };
    } else {
      return { status: 'not-found' };
    }
  } catch (error) {
    console.error('Error tracking complaints via server action:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { status: 'error', error: `Failed to fetch complaint status: ${errorMessage}` };
  }
}

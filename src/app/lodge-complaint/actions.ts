'use server';

import { categorizeAndPrioritizeComplaint } from '@/ai/flows/categorize-and-prioritize-complaint';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { z } from 'zod';

const GOOGLE_APP_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec'; // IMPORTANT: Replace with your deployed Google Apps Script URL

const formSchema = z.object({
  title: z.string(),
  description: z.string(),
  location: z.string(),
  complaintImage: z.instanceof(File),
  idProofImage: z.instanceof(File),
});

export async function handleComplaintSubmission(
  formData: FormData
): Promise<{ success: boolean; issueId?: string; error?: string }> {
  try {
    const rawFormData = {
      title: formData.get('title'),
      description: formData.get('description'),
      location: formData.get('location'),
      complaintImage: formData.get('complaintImage'),
      idProofImage: formData.get('idProofImage'),
    };

    const parsed = formSchema.safeParse(rawFormData);
    if (!parsed.success) {
      console.error('Form validation failed:', parsed.error.flatten().fieldErrors);
      throw new Error('Invalid form data provided.');
    }

    const { title, description, location } = parsed.data;

    // 1. Generate a unique issue ID
    const issueId = `CIV-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // 2. Call GenAI flow for categorization and prioritization
    const { category, priority } = await categorizeAndPrioritizeComplaint({ description });

    // 3. Simulate image upload and get URL (using placeholder)
    const imageUrl = PlaceHolderImages.find(p => p.id === 'complaint-image-placeholder')?.imageUrl || '';

    // 4. Get current timestamp
    const timestamp = new Date().toISOString();
    
    // 5. Prepare data for Google Sheets in tuple/array format
    const sheetData = [
        issueId,
        title,
        description,
        category,
        priority,
        location,
        imageUrl,
        'Unassigned',
        timestamp
    ];
    
    // 6. Send data to Google Apps Script
    // Note: In a real-world scenario, you might want to add authentication (e.g., an API key)
    // to secure your Apps Script endpoint.
    if (GOOGLE_APP_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
      console.warn('Google Apps Script URL is not configured. Skipping submission.');
      // For demonstration, we'll return success without actually posting.
      // In production, you might want to throw an error here.
    } else {
        const response = await fetch(GOOGLE_APP_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ data: sheetData }),
            // As per Next.js App Router recommendation for fetch in Server Actions
            cache: 'no-store', 
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Failed to submit to Google Sheet:', errorBody);
            throw new Error('There was an issue submitting your complaint to our system.');
        }

        const result = await response.json();
        if (result.status !== 'success') {
            console.error('Google Apps Script returned an error:', result.message);
            throw new Error(result.message || 'An error occurred within our submission system.');
        }
    }


    return { success: true, issueId };
  } catch (error) {
    console.error('Complaint submission failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return { success: false, error: errorMessage };
  }
}

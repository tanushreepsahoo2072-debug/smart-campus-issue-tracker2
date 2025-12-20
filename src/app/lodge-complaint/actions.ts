'use server';

import { categorizeAndPrioritizeComplaint } from '@/ai/flows/categorize-and-prioritize-complaint';
import { z } from 'zod';

// IMPORTANT: Replace with your deployed Google Apps Script URL
const GOOGLE_APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz2FRXSJu8WziHyuc7pDOtALFrRgRVyf0MC-vZiBxwMBN65CmRtEhVaKP0hACM60Zbkgg/exec';

const formSchema = z.object({
  title: z.string().min(1, "Title is required."),
  description: z.string().min(1, "Description is required."),
  location: z.string().min(1, "Location is required."),
  email: z.string().email(),
});

export async function handleComplaintSubmission(
  formData: FormData
): Promise<{ success: boolean; issueId?: string; error?: string }> {
  try {
    const rawFormData = {
      title: formData.get('title'),
      description: formData.get('description'),
      location: formData.get('location'),
      email: formData.get('email'),
    };

    const parsed = formSchema.safeParse(rawFormData);
    if (!parsed.success) {
      console.error('Form validation failed:', parsed.error.flatten().fieldErrors);
      // Construct a user-friendly error message
      const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] || 'Invalid form data provided.';
      throw new Error(firstError);
    }

    const { title, description, location, email } = parsed.data;

    // 1. Generate a unique issue ID
    const issueId = `CIV-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // 2. Call GenAI flow for categorization and prioritization
    const { category, priority } = await categorizeAndPrioritizeComplaint({ description });

    // 3. Set a dummy image URL
    const imageUrl = 'N/A';

    // 4. Get current timestamp
    const timestamp = new Date().toISOString();
    
    // 5. Prepare data for Google Sheets in tuple/array format
    const sheetData = [
        issueId,
        email,
        title,
        description,
        category,
        priority,
        location,
        imageUrl,
        'Pending',
        timestamp
    ];
    
    // 6. Send data to Google Apps Script
    if (GOOGLE_APP_SCRIPT_URL.includes('YOUR_SCRIPT_ID') || GOOGLE_APP_SCRIPT_URL === 'https://script.google.com/macros/s/AKfycbw_y8j-a4q9pYx6aL4G2R3e1b7c8d9e0f1g2h3i4j5k6l7m8n9o0p/exec') {
      console.warn('Google Apps Script URL is the template URL. Please replace it with your own.');
      // In a real scenario, you would throw an error. For this demo, we proceed.
    }
    
    const response = await fetch(GOOGLE_APP_SCRIPT_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        // The body needs to be structured to match the Apps Script expectation
        body: JSON.stringify({ data: sheetData }),
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


    return { success: true, issueId };
  } catch (error) {
    console.error('Complaint submission failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return { success: false, error: errorMessage };
  }
}

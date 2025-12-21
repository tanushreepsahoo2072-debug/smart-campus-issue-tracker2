'use server';

// IMPORTANT: Replace with your deployed Google Apps Script URL
const GOOGLE_APP_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbw_y8j-a4q9pYx6aL4G2R3e1b7c8d9e0f1g2h3i4j5k6l7m8n9o0p/exec';

import { z } from 'zod';
import { categorizeAndPrioritizeComplaint } from '@/ai/flows/categorize-and-prioritize-complaint';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().min(1, 'Description is required.'),
  location: z.string().min(1, 'Location is required.'),
  email: z.string().email(),
});

function generateUniqueId() {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `CIV-${timestamp}-${randomPart}`;
}

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
      const firstError =
        Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ||
        'Invalid form data provided.';
      throw new Error(firstError);
    }

    const { title, description, location, email } = parsed.data;
    const issueId = generateUniqueId();
    const timestamp = new Date().toISOString();

    // Call AI to categorize and prioritize
    const aiResponse = await categorizeAndPrioritizeComplaint({ description });
    const { category, priority } = aiResponse;

    const dataToSave = {
      data: [
        issueId,
        email,
        title,
        description,
        category,
        priority,
        location,
        'N/A', // Placeholder for imageUrl
        'Pending',
        timestamp,
      ],
    };

    if (
      GOOGLE_APP_SCRIPT_URL.includes('YOUR_SCRIPT_ID') ||
      GOOGLE_APP_SCRIPT_URL ===
        'https://script.google.com/macros/s/AKfycbw_y8j-a4q9pYx6aL4G2R3e1b7c8d9e0f1g2h3i4j5k6l7m8n9o0p/exec'
    ) {
      console.warn('Google Apps Script URL is not configured. Skipping submission.');
      return { success: true, issueId };
    }

    const response = await fetch(GOOGLE_APP_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(dataToSave),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to submit to Google Sheet. Status: ${response.status}. Response: ${errorText}`
      );
    }

    const result = await response.json();
    if (result.status !== 'success') {
      throw new Error(`Google Apps Script reported an error: ${result.message}`);
    }

    return { success: true, issueId };
  } catch (error) {
    console.error('Complaint submission failed:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown server error occurred.';
    return { success: false, error: errorMessage };
  }
}

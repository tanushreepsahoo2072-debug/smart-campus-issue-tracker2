'use server';

import { z } from 'zod';
// import { categorizeAndPrioritizeComplaint } from '@/ai/flows/categorize-and-prioritize-complaint';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().min(1, 'Description is required.'),
  location: z.string().min(1, 'Location is required.'),
  email: z.string().email(),
  // attachments will be handled separately, not in this server action for now
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
    
    // The core logic for saving to a database is currently paused.
    // This function validates the data and returns a mock success response.
    const issueId = generateUniqueId();
    console.log('Form data validated successfully. Submission logic is paused.');

    // When ready to implement, add database logic here (e.g., Firestore, Google Sheets).

    return { success: true, issueId };

  } catch (error) {
    console.error('Complaint submission failed:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown server error occurred.';
    return { success: false, error: errorMessage };
  }
}

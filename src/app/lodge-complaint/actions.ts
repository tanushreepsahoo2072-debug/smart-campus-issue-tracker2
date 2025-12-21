'use server';

import { z } from 'zod';

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

/**
 * This server action is currently a placeholder.
 * The primary complaint submission logic (generating a downloadable text file)
 * is handled on the client-side in `src/components/complaint-form.tsx`.
 *
 * This function validates the form data and returns a unique ID,
 * but does not save data to any database.
 */
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
      const firstError =
        Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ||
        'Invalid form data provided.';
      throw new Error(firstError);
    }
    
    // This function validates the data and returns a mock success response.
    // No database logic is executed here.
    const issueId = generateUniqueId();
    console.log('Form data validated on server. Submission logic is on the client.');

    return { success: true, issueId };

  } catch (error) {
    console.error('Server-side validation failed:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown server error occurred.';
    return { success: false, error: errorMessage };
  }
}

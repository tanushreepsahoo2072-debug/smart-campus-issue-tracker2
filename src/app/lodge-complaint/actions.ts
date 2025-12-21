'use server';

import { z } from 'zod';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().min(1, 'Description is required.'),
  location: z.string().min(1, 'Location is required.'),
  email: z.string().email(),
  attachments: z.array(z.string()),
});

export async function handleComplaintSubmission(
  formData: FormData
): Promise<{ success: boolean; issueId?: string; error?: string }> {
  // This server action is currently a placeholder.
  // The primary submission logic is handled on the client-side for testing.
  try {
    const rawData = {
      title: formData.get('title'),
      description: formData.get('description'),
      location: formData.get('location'),
      email: formData.get('email'),
      attachments: formData.getAll('attachments[]'),
    };

    const parsed = formSchema.safeParse(rawData);

    if (!parsed.success) {
      const firstError =
        Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ||
        'Invalid form data provided.';
      throw new Error(firstError);
    }
    
    // In a real scenario, this is where you would save to a database.
    // For now, we just simulate a success response.
    const mockIssueId = `CIV-${Date.now()}`;
    return { success: true, issueId: mockIssueId };

  } catch (error) {
    console.error('Error handling complaint submission:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown server error occurred.';
    return { success: false, error: errorMessage };
  }
}

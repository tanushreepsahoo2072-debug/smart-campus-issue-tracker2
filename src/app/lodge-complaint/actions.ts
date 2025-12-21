'use server';

import { z } from 'zod';
import { initializeFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { categorizeAndPrioritizeComplaint } from '@/ai/flows/categorize-and-prioritize-complaint';

const { firestore } = initializeFirebase();

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
  try {
    const rawData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      location: formData.get('location') as string,
      email: formData.get('email') as string,
      // We'll just get the names for now. The files themselves are not uploaded yet.
      attachments: (formData.getAll('attachments') as File[]).map(f => f.name),
    };

    const parsed = formSchema.safeParse(rawData);

    if (!parsed.success) {
      const firstError =
        Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ||
        'Invalid form data provided.';
      throw new Error(firstError);
    }
    
    const { category, priority } = await categorizeAndPrioritizeComplaint({
      description: parsed.data.description,
    });

    const docRef = await addDoc(collection(firestore, 'complaints'), {
      email: parsed.data.email,
      title: parsed.data.title,
      description: parsed.data.description,
      category: category,
      priority: priority,
      location: parsed.data.location,
      imageUrls: parsed.data.attachments,
      status: 'InProgress',
      timestamp: serverTimestamp(),
    });

    return { success: true, issueId: docRef.id };

  } catch (error) {
    console.error('Error handling complaint submission:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown server error occurred.';
    return { success: false, error: errorMessage };
  }
}

'use server';

import { z } from 'zod';
import { initializeFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const { firestore } = initializeFirebase();

const formSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().min(1, 'Description is required.'),
  location: z.string().min(1, 'Location is required.'),
  email: z.string().email(),
  createdBy: z.string().optional(),
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
      createdBy: formData.get('createdBy') as string,
    };

    const parsed = formSchema.safeParse(rawData);

    if (!parsed.success) {
      const firstError =
        Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ||
        'Invalid form data provided.';
      throw new Error(firstError);
    }

    const createdBy = parsed.data.createdBy || 'anonymous';
    
    const complaintDocRef = await addDoc(collection(firestore, 'complaints'), {
      title: parsed.data.title,
      description: parsed.data.description,
      location: parsed.data.location,
      email: parsed.data.email,
      createdBy: createdBy,
      category: 'Infrastructure',
      priority: 'Not-Assigned',
      currentStatus: 'Open',
      assignedTo: '',
      frequency: 'one-time',
      createdAt: serverTimestamp(),
    });
    
    return { success: true, issueId: complaintDocRef.id };

  } catch (error) {
    console.error('Error handling complaint submission:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown server error occurred.';
    return { success: false, error: errorMessage };
  }
}

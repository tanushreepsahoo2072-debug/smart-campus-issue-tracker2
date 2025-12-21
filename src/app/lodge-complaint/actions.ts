'use server';

import { z } from 'zod';
import { initializeFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const { firestore, app } = initializeFirebase();
const auth = getAuth(app);

const formSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().min(1, 'Description is required.'),
  location: z.string().min(1, 'Location is required.'),
  email: z.string().email(),
  attachments: z.array(z.string()),
  reportedBy: z.string().min(1, 'User must be authenticated.'),
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
      attachments: (formData.getAll('attachments') as File[]).map(f => f.name),
      reportedBy: formData.get('reportedBy') as string,
    };

    const parsed = formSchema.safeParse(rawData);

    if (!parsed.success) {
      const firstError =
        Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ||
        'Invalid form data provided.';
      throw new Error(firstError);
    }
    
    const docRef = await addDoc(collection(firestore, 'complaints'), {
      title: parsed.data.title,
      description: parsed.data.description,
      location: parsed.data.location,
      email: parsed.data.email,
      reportedBy: parsed.data.reportedBy,
      imageUrls: parsed.data.attachments,
      category: 'Electrical', // default from snippet
      priority: 'High', // default from snippet
      status: 'Open', // default from snippet
      assignedTo: '', // default from snippet
      frequency: 'recurring', // default from snippet
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


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
  imageUrls: z.array(z.string().url()).optional(),
});

type ComplaintData = z.infer<typeof formSchema>;

export async function handleComplaintSubmission(
  data: ComplaintData
): Promise<{ success: boolean; issueId?: string; error?: string }> {
  try {
    const parsed = formSchema.safeParse(data);

    if (!parsed.success) {
      const firstError =
        Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ||
        'Invalid form data provided.';
      throw new Error(firstError);
    }

    const { title, description, location, email, createdBy, imageUrls } = parsed.data;
    
    const complaintDocRef = await addDoc(collection(firestore, 'complaints'), {
      title,
      description,
      location,
      email,
      createdBy: createdBy || 'anonymous',
      imageUrls: imageUrls || [],
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

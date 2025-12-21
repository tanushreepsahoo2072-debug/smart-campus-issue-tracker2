'use server';

import { z } from 'zod';
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

// Initialize Firebase Admin SDK
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
    const attachmentNames = formData.getAll('attachments[]');

    const rawFormData = {
      title: formData.get('title'),
      description: formData.get('description'),
      location: formData.get('location'),
      email: formData.get('email'),
      attachments: attachmentNames,
    };

    const parsed = formSchema.safeParse(rawFormData);

    if (!parsed.success) {
      const firstError =
        Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ||
        'Invalid form data provided.';
      throw new Error(firstError);
    }

    const { title, description, location, email, attachments } = parsed.data;

    const complaintData = {
      email,
      title,
      description,
      category: '',
      priority: '',
      location,
      imageUrls: attachments,
      status: 'InProgress',
      timestamp: serverTimestamp(),
    };

    const docRef = await addDoc(collection(firestore, 'complaints'), complaintData);

    return { success: true, issueId: docRef.id };
  } catch (error) {
    console.error('Error saving complaint to Firestore:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown server error occurred.';
    return { success: false, error: errorMessage };
  }
}

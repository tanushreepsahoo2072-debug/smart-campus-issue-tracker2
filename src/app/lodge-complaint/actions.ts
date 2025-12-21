'use server';

import { z } from 'zod';
import { initializeFirebase } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().min(1, 'Description is required.'),
  location: z.string().min(1, 'Location is required.'),
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
      const firstError =
        Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ||
        'Invalid form data provided.';
      throw new Error(firstError);
    }

    const { title, description, location, email } = parsed.data;
    
    // Extract file names from FormData
    const files = formData.getAll('attachment') as File[];
    const imageUrls = files.map(file => file.name);

    // Initialize Firebase
    const { firestore } = initializeFirebase();
    
    // Prepare data for Firestore
    const complaintData = {
      email,
      title,
      description,
      category: "", // Empty string as requested
      priority: "", // Empty string as requested
      location,
      imageUrls, // Array of filenames
      status: "InProgress", // Hardcoded as requested
      timestamp: serverTimestamp(),
    };

    // Add document to the 'complaints' collection
    const docRef = await addDoc(collection(firestore, "complaints"), complaintData);

    return { success: true, issueId: docRef.id };
    
  } catch (error) {
    console.error('Complaint submission failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return { success: false, error: errorMessage };
  }
}

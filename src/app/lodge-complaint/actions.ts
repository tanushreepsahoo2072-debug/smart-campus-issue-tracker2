'use server';

import { z } from 'zod';
import { initializeFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const { firestore, app } = initializeFirebase();
const storage = getStorage(app);

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
      createdBy: formData.get('reportedBy') as string, // Note: form sends reportedBy
    };

    const parsed = formSchema.safeParse(rawData);

    if (!parsed.success) {
      const firstError =
        Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ||
        'Invalid form data provided.';
      throw new Error(firstError);
    }

    const createdBy = parsed.data.createdBy || 'anonymous';
    const attachments = formData.getAll('attachments') as File[];
    const imageUrls: string[] = [];

    if (attachments.length > 0 && attachments[0].size > 0) {
      // Correctly generate a new document ID for the storage path using v9 syntax
      const tempIssueId = doc(collection(firestore, 'complaints')).id;

      const photoUploadPromises = attachments.map(async (file) => {
        const storageRef = ref(storage, `complaints/${tempIssueId}/${file.name}`);
        await uploadBytes(storageRef, file);
        const imageUrl = await getDownloadURL(storageRef);
        imageUrls.push(imageUrl);
      });

      await Promise.all(photoUploadPromises);
    }

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
      imageUrls: imageUrls,
    });
    
    return { success: true, issueId: complaintDocRef.id };

  } catch (error) {
    console.error('Error handling complaint submission:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown server error occurred.';
    return { success: false, error: errorMessage };
  }
}

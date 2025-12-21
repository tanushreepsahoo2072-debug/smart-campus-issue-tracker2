'use server';

import { z } from 'zod';
import { initializeFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const { firestore, app } = initializeFirebase();
const storage = getStorage(app);

const formSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().min(1, 'Description is required.'),
  location: z.string().min(1, 'Location is required.'),
  email: z.string().email(),
  reportedBy: z.string().optional(),
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
      reportedBy: formData.get('reportedBy') as string,
    };

    const parsed = formSchema.safeParse(rawData);

    if (!parsed.success) {
      const firstError =
        Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ||
        'Invalid form data provided.';
      throw new Error(firstError);
    }

    const reportedBy = parsed.data.reportedBy || 'anonymous';

    const complaintDocRef = await addDoc(collection(firestore, 'complaints'), {
      title: parsed.data.title,
      description: parsed.data.description,
      location: parsed.data.location,
      email: parsed.data.email,
      reportedBy: reportedBy,
      category: 'Uncategorized',
      priority: 'Not-Assigned',
      status: 'Open',
      assignedTo: '',
      frequency: 'one-time',
      timestamp: serverTimestamp(),
    });

    const issueId = complaintDocRef.id;
    const attachments = formData.getAll('attachments') as File[];

    if (attachments.length > 0 && attachments[0].size > 0) {
      const photoUploadPromises = attachments.map(async (file) => {
        const storageRef = ref(storage, `complaints/${issueId}/${file.name}`);
        await uploadBytes(storageRef, file);
        const imageUrl = await getDownloadURL(storageRef);

        const photosCollectionRef = collection(firestore, 'complaints', issueId, 'photos');
        await addDoc(photosCollectionRef, {
          imageUrl: imageUrl,
          uploadedBy: reportedBy,
          uploadedAt: serverTimestamp(),
        });
      });

      await Promise.all(photoUploadPromises);
    }
    
    return { success: true, issueId: issueId };

  } catch (error) {
    console.error('Error handling complaint submission:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown server error occurred.';
    return { success: false, error: errorMessage };
  }
}

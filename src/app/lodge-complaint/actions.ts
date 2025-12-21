'use server';

import { z } from 'zod';
import { initializeFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const { firestore, app } = initializeFirebase();
const storage = getStorage(app);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const formSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().min(1, 'Description is required.'),
  location: z.string().min(1, 'Location is required.'),
  email: z.string().email(),
  createdBy: z.string().optional(),
  attachments: z
    .array(
      z
        .any()
        .refine((file) => file.size <= MAX_FILE_SIZE, `File size must be less than 5MB.`)
        .refine(
          (file) => ALLOWED_FILE_TYPES.includes(file.type),
          'Only .jpg, .jpeg, .png, .webp, and .gif formats are supported.'
        )
    )
    .optional(),
});

export async function handleComplaintSubmission(
  formData: FormData
): Promise<{ success: boolean; issueId?: string; error?: string }> {
  try {
    const files = formData.getAll('attachments') as File[];
    const rawData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      location: formData.get('location') as string,
      email: formData.get('email') as string,
      createdBy: formData.get('createdBy') as string,
      attachments: files.filter((file) => file.size > 0),
    };

    const parsed = formSchema.safeParse(rawData);

    if (!parsed.success) {
      const firstError =
        Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ||
        'Invalid form data provided.';
      throw new Error(firstError);
    }

    const { title, description, location, email } = parsed.data;
    const createdBy = parsed.data.createdBy || 'anonymous';
    const attachments = parsed.data.attachments || [];

    // Use a temporary doc to get an ID for storage paths
    const tempIssueRef = doc(collection(firestore, 'complaints'));
    const tempIssueId = tempIssueRef.id;

    const imageUrls: string[] = [];
    if (attachments.length > 0) {
      const uploadPromises = attachments.map(async (file) => {
        const storageRef = ref(storage, `complaints/${tempIssueId}/${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        imageUrls.push(downloadURL);
      });
      await Promise.all(uploadPromises);
    }

    // Now create the actual document with the final ID and data
    const complaintDocRef = await addDoc(collection(firestore, 'complaints'), {
      title,
      description,
      location,
      email,
      createdBy,
      imageUrls, // Save the array of URLs
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

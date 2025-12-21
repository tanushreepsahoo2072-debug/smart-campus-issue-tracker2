
'use server';

import { z } from 'zod';
import { initializeFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const { firestore } = initializeFirebase();

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

async function uploadImages(files: File[]): Promise<string[]> {
  const urls: string[] = [];
  const IMGBB_API_KEY = 'c1fc19fa6575a721e6a1ee966f5ee216'; 

  for (const file of files) {
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (data.success) {
      urls.push(data.data.url);
    } else {
      // Handle potential upload error from imgbb
      throw new Error(data.error?.message || 'Failed to upload image to imgbb.');
    }
  }

  return urls;
}


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

    let imageUrls: string[] = [];
    if (attachments.length > 0) {
      imageUrls = await uploadImages(attachments);
    }
    
    const complaintDocRef = await addDoc(collection(firestore, 'complaints'), {
      title,
      description,
      location,
      email,
      createdBy,
      imageUrls,
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

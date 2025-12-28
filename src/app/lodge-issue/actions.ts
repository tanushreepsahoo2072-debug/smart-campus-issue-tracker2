
'use server';

import { z } from 'zod';
import { initializeFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, updateDoc, runTransaction  } from 'firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';


const { firestore } = initializeFirebase();


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

const issueSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().min(1, 'Description is required.'),
  latitude: z.number(),
  longitude: z.number(),
  email: z.string().email(),
  imageUrls: z.array(z.string().url()).optional(),
  imageDataUris: z.array(z.string()).optional(), // Base64 image data
  issueId: z.string().optional(), // Optional issueId for updates
});

type IssueData = z.infer<typeof issueSchema>;

const LOCATION_OFFSET = 0.001; // For proximity check

async function analyzeIssueWithAI(issueId: string, data: IssueData) {
  // Only proceed if we have image data to analyze
  if (!data.imageDataUris || data.imageDataUris.length === 0) {
    console.log(`[AI_SKIP] Skipping analysis for issue ${issueId} due to no image data.`);
    // Set to a neutral state if no analysis is done
    const issueRef = doc(firestore, 'issues', issueId);
    await updateDoc(issueRef, { 
        AI: 1, // Mark as "complete" since there's nothing to do
        currentStatus: 'Open',
        category: 'Other',
        ai_priority: 'Medium',
        AI_COMMENT: 'No image provided for analysis. Please review manually.'
    });
    return;
  }

  console.log(`[AI_STEP] Starting analysis for issue: ${issueId}`);
  try {
    // 1. Find candidate issues for deduplication
    console.log('[AI_STEP] 1. Finding candidate issues for deduplication...');
    const candidates: any[] = [];
    if (data.latitude && data.longitude) {
      const lat = data.latitude;
      const lon = data.longitude;
      const latMin = lat - LOCATION_OFFSET;
      const latMax = lat + LOCATION_OFFSET;
      const lonMin = lon - LOCATION_OFFSET;
      const lonMax = lon + LOCATION_OFFSET;

      console.log(`[AI_DEBUG] Bounding Box: lat(${latMin}-${latMax}), lon(${lonMin}-${lonMax})`);

      const issuesRef = collection(firestore, 'issues');
       

      const q = query(
        issuesRef,
        where('currentStatus', 'in', ['Open', 'In Progress']),
        where('latitude', '>=', latMin),
        where('latitude', '<=', latMax)
      );
        
      const querySnapshot = await getDocs(q);
          

      querySnapshot.forEach(doc => {
        const docData = doc.data();
        if (doc.id !== issueId && docData.longitude >= lonMin && docData.longitude <= lonMax) {
            candidates.push({
              id: doc.id,
              title: docData.title,
              description: docData.description,
              category: docData.category,
            });
        }
      });
      console.log(`[AI_DEBUG] Found ${candidates.length} candidates for deduplication.`);
    }

    // 2. Prepare for Gemini API call
    console.log('[AI_STEP] 2. Preparing prompt for Gemini API call...');
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

    const nearbyIssuesText = candidates.length
      ? candidates.map(c => `- ID: ${c.id}, Title: "${c.title}", Category: ${c.category}`).join('\n')
      : 'No nearby issues were found.';

    const prompt = `
      You are an automated Campus Maintenance Dispatcher. Your goal is to process a new incident report and determine its validity and priority.
      
      New Issue Details:
      - Title: ${data.title}
      - Description: ${data.description}

      Nearby Issues to check for duplicates:
      ${nearbyIssuesText}

      Perform the following tasks and return your decision ONLY in the specified JSON format.

      Task 1: Safety & Authenticity. Check the image. If it is offensive, a meme, a stock photo, clearly AI-generated, or completely unrelated to a plausible campus maintenance issue, set "is_spam" to true and "status_update" to "Denied by AI". Provide a reason in "AI_COMMENT".

      Task 2: Deduplication. Compare the new issue's image and description to the 'Nearby Issues' list. If it reports the exact same physical item (e.g., the same broken window, not just another broken window), set "is_duplicate" to true and "duplicate_id" to the ID of the original issue.

      Task 3: Classification. If the report is valid and unique, assign a "category" from this list: [Maintenance, Safety, IT Support, Landscaping, Facilities, Other, Electrical, Plumbing].

      Task 4: Severity. If valid and unique, assign a "priority" from this list: [Critical, High, Medium, Low]. Use 'Critical' only for immediate life-safety risks (e.g., sparking wires, major flooding visible in the image). Base your decision on the visual evidence.
      
      Return ONLY a JSON object in this format: { "is_spam": boolean, "is_duplicate": boolean, "duplicate_id": string | null, "category": "string", "priority": "string", "AI_COMMENT": "1-sentence summary of findings", "status_update": "Open" | "Denied by AI" }
    `;
    console.log('[AI_DEBUG] Constructed Prompt:', prompt);

    const imageParts = data.imageDataUris?.map(uri => {
      const [header, base64Data] = uri.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1];
      if (!mimeType || !base64Data) throw new Error('Invalid Data URI');
      return { inlineData: { data: base64Data, mimeType } };
    }) || [];
    
    console.log(`[AI_DEBUG] Prepared ${imageParts.length} image parts for the API call.`);

    // 3. Call Gemini API
    console.log('[AI_STEP] 3. Calling Gemini API...');
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const jsonString = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    console.log('[AI_DEBUG] Raw response from Gemini:', jsonString);

    const aiResult = JSON.parse(jsonString);
    console.log('[AI_DEBUG] Parsed AI Result:', aiResult);


    // 4. Process AI result and update Firestore
    console.log('[AI_STEP] 4. Processing AI result and updating Firestore...');
    const issueRef = doc(firestore, 'issues', issueId);

    if (aiResult.is_spam || aiResult.status_update === 'Denied by AI') {
      console.log('[AI_DECISION] Issue flagged as SPAM or Denied by AI.');
      await updateDoc(issueRef, {  
        currentStatus: 'Denied by AI',
        is_spam: true,
        AI_COMMENT: aiResult.AI_COMMENT,
        AI: 1,
      });
    } else if (aiResult.is_duplicate && aiResult.duplicate_id) {
        console.log(`[AI_DECISION] Issue flagged as DUPLICATE of ${aiResult.duplicate_id}.`);
        const originalIssueRef = doc(firestore,'issues',aiResult.duplicate_id);
      
        await runTransaction(firestore, async (transaction) => {
            const originalDoc = await transaction.get(originalIssueRef);
            if (!originalDoc.exists) {
                console.log('[AI_DEBUG] Original duplicate not found. Treating as a new unique issue.');
                // If original doc is gone, treat as unique issue
                transaction.update(issueRef, {
                    category: aiResult.category,
                    ai_priority: aiResult.priority,
                    currentStatus: 'Open',
                    AI_COMMENT: 'Marked as duplicate but original was not found. Treated as new.',
                    AI: 1,
                });
                return;
            }

            const originalData = originalDoc.data()!;
            const newFrequency = (originalData.frequency || 1) + 1;
            let newPriority = originalData.ai_priority;
            
            console.log(`[AI_DEBUG] Original issue has frequency ${originalData.frequency}. New frequency: ${newFrequency}`);
            
            transaction.update(issueRef, {
                is_spam: true, // Mark as duplicate
                merged_into: aiResult.duplicate_id,
                AI_COMMENT: aiResult.AI_COMMENT,
                AI: 1,
            });

            if (newFrequency >= 5) {
                const priorityOrder: string[] = ['Low', 'Medium', 'High', 'Critical'];
                const currentPriorityIndex = priorityOrder.indexOf(newPriority);
                if (currentPriorityIndex < priorityOrder.length - 1) {
                    newPriority = priorityOrder[currentPriorityIndex + 1];
                    console.log(`[AI_ACTION] Priority boosted to ${newPriority}. Resetting frequency.`);
                    transaction.update(originalIssueRef, { frequency: 0, ai_priority: newPriority });
                } else {
                    transaction.update(originalIssueRef, { frequency: newFrequency });
                }
            } else {
                transaction.update(originalIssueRef, { frequency: newFrequency });
            }
        });

    } else {
      console.log('[AI_DECISION] Issue is VALID and UNIQUE.');
      await updateDoc(issueRef,{
        category: aiResult.category,
        ai_priority: aiResult.priority,
        currentStatus: 'Open',
        AI_COMMENT: aiResult.AI_COMMENT,
        AI: 1,
      });
    }
    console.log(`[AI_STEP] Successfully processed and updated issue: ${issueId}`);
  }catch (error: unknown) {
    console.error('Error in AI analysis background task:', error);
    const issueRef = doc(firestore, 'issues', issueId);
    const err = error instanceof Error ? error : { message: 'Unknown error', stack: null, name: null };
  
    await updateDoc(issueRef, {
      AI: -1,
      AI_COMMENT: {
        message: err.message,
        stack: err.stack,
        name: err.name,
      },
    });
  }
}

export async function handleIssueSubmission(
  data: IssueData
): Promise<{ success: boolean; issueId?: string; error?: string }> {
  try {
    const parsed = issueSchema.safeParse(data);

    if (!parsed.success) {
      throw new Error('Invalid form data.');
    }

    // If an issueId is provided and we have image data, it means we are in the
    // second phase of submission (post-image-upload) and should trigger AI analysis.
    if (parsed.data.issueId && parsed.data.imageDataUris && parsed.data.imageDataUris.length > 0) {
      // Don't await this, let it run in the background
      analyzeIssueWithAI(parsed.data.issueId, parsed.data);
      return { success: true, issueId: parsed.data.issueId };
    }
    
    // If no issueId is present, this is the first phase: create the document.
    if (!parsed.data.issueId) {
        const issueDocRef = await addDoc(
          collection(firestore, 'issues'),
          {
            title: parsed.data.title,
            description: parsed.data.description,
            latitude: parsed.data.latitude,
            longitude: parsed.data.longitude,
            email: parsed.data.email,
            imageUrls: parsed.data.imageUrls || [],
            createdAt: serverTimestamp(),
          
          // Default / pending fields
          currentStatus: 'Pending',
          category: '',
          ai_priority: 'Not-Assigned',
          assignedTo: '',
          frequency: 1,
          updatedAt: null,
          admin_comments: '',
          merged_into: null,
          is_spam: false,
          AI_COMMENT: '',
          AI: 0, // Mark as pending AI analysis
          is_duplicate: false,
        });

        const issueId = issueDocRef.id;

        // If there were no images to upload, the process is done.
        // Trigger AI analysis now (which will see no images and handle it).
        if (!parsed.data.imageDataUris || parsed.data.imageDataUris.length === 0) {
            analyzeIssueWithAI(issueId, parsed.data);
        }

        // Return the ID for the client to use for image uploads.
        return { success: true, issueId: issueId };
    }
    
    return { success: true };

  } catch (error) {
    console.error('Error handling issue submission:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return { success: false, error: errorMessage };
  }
}

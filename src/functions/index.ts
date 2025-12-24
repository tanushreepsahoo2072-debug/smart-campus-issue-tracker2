
import { initializeApp, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { https, HttpsError } from 'firebase-functions';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { processComplaintFlow } from '../ai/flows/process-complaint';
import type { Complaint } from '../types/complaint';

let app: App;
let firestore: ReturnType<typeof getFirestore>;

const init = () => {
    if (!app) {
        app = initializeApp();
        firestore = getFirestore(app);
    }
};

const LOCATION_OFFSET = 0.001; // Small degree offset for GPS proximity check

export const processnewcomplaint = onDocumentCreated(
  'issues/{issueId}',
  async (event) => {
    init();
    const snapshot = event.data;
    if (!snapshot) {
      console.log('No data associated with the event');
      return;
    }
    const complaintData = snapshot.data() as Complaint;
    const issueId = snapshot.id;

    // 1. Find candidate issues for deduplication
    const candidates: Complaint[] = [];
    if (complaintData.location) {
        try {
            const [lat, lon] = complaintData.location.split(',').map(parseFloat);
            const latMin = lat - LOCATION_OFFSET;
            const latMax = lat + LOCATION_OFFSET;
            const lonMin = lon - LOCATION_OFFSET;
            const lonMax = lon + LOCATION_OFFSET;

            const issuesRef = firestore.collection('issues');
            // Firestore doesn't support geo queries natively in this way.
            // A simple query can filter a bit, but for true geoqueries, an external service like Geofire is needed.
            // This is a simplified approach for demonstration. A more robust solution would involve range queries on lat/lon.
            const querySnapshot = await issuesRef
                .where('status', 'in', ['Open', 'In Progress'])
                .get();

            querySnapshot.forEach(doc => {
                const docData = doc.data() as Complaint;
                if(doc.id !== issueId && docData.location) {
                    const [docLat, docLon] = docData.location.split(',').map(parseFloat);
                    if (docLat > latMin && docLat < latMax && docLon > lonMin && docLon < lonMax) {
                        candidates.push({ id: doc.id, ...docData });
                    }
                }
            });
        } catch(e) {
            console.error("Error fetching candidate issues:", e);
        }
    }


    // 2. Call the Genkit flow with retry logic
    let aiResult;
    for (let i = 0; i < 2; i++) { // Try up to 2 times
        try {
            aiResult = await processComplaintFlow({
                issueId: issueId,
                title: complaintData.title,
                description: complaintData.description,
                imageUrl: complaintData.imageUrls?.[0] || '',
                nearbyIssues: candidates.map(c => ({ id: c.id, title: c.title, description: c.description, category: c.category })),
            });
            break; // Success, exit loop
        } catch (error) {
            console.error(`AI flow attempt ${i + 1} failed:`, error);
            if (i < 1) {
                await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
            } else {
                 // If all retries fail, update the document to indicate an error.
                await firestore.collection('issues').doc(issueId).update({
                    AI: -1, // Use -1 to signify an AI processing error
                    AI_COMMENT: 'AI analysis failed after multiple attempts. Please review manually.',
                });
                return;
            }
        }
    }

    if (!aiResult) {
        console.error('AI Result is undefined after retries.');
        return;
    }

    // 3. Process AI result and update Firestore
    const issueRef = firestore.collection('issues').doc(issueId);

    if (aiResult.is_spam || aiResult.status_update === 'Denied') {
        await issueRef.update({
            status: 'Denied',
            is_spam: true, // Mark as spam/denied
            AI_COMMENT: aiResult.AI_COMMENT,
            AI: 1, // Mark AI processing as complete
        });
    } else if (aiResult.is_duplicate && aiResult.duplicate_id) {
        const originalIssueRef = firestore.collection('issues').doc(aiResult.duplicate_id);
        
        await firestore.runTransaction(async (transaction) => {
            const originalDoc = await transaction.get(originalIssueRef);
            if (!originalDoc.exists) {
                throw new Error("Original document for duplication not found!");
            }

            const originalData = originalDoc.data() as Complaint;
            const newFrequency = (originalData.frequency || 0) + 1;
            let newPriority = originalData.priority;

            if (newFrequency >= 5) {
                const priorityOrder: Complaint['priority'][] = ['Low', 'Medium', 'High', 'Critical'];
                const currentPriorityIndex = priorityOrder.indexOf(newPriority);
                if (currentPriorityIndex < priorityOrder.length - 1) {
                    newPriority = priorityOrder[currentPriorityIndex + 1];
                }
                // Reset frequency
                transaction.update(originalIssueRef, { frequency: 0, priority: newPriority });
            } else {
                transaction.update(originalIssueRef, { frequency: newFrequency });
            }

            transaction.update(issueRef, {
                is_spam: true, // Mark as duplicate
                merged_into: aiResult.duplicate_id,
                AI_COMMENT: aiResult.AI_COMMENT,
                AI: 1,
            });
        });

    } else {
        // Valid & unique issue
        await issueRef.update({
            category: aiResult.category,
            priority: aiResult.priority,
            status: 'Open',
            AI_COMMENT: aiResult.AI_COMMENT,
            AI: 1,
        });
    }
  }
);


// This function is designed to be called by a trusted administrator.
export const setAuthorityClaim = https.onCall(async (data, context) => {
  init();
  // Ensure the function is called by an authenticated user.
  if (!context.auth) {
    throw new HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  const email = data.email;
  if (typeof email !== 'string' || !email) {
    throw new HttpsError(
      'invalid-argument',
      'The function must be called with a valid "email" argument.'
    );
  }

  try {
    const auth = getAuth(app);
    const user = await auth.getUserByEmail(email);
    await auth.setCustomUserClaims(user.uid, { role: 'authority' });

    return {
      message: `Success! ${email} has been made an authority. They may need to sign out and sign back in for the changes to take effect.`,
    };
  } catch (error: any) {
    console.error('Error setting custom claim:', error);
    throw new HttpsError(
      'internal',
      error.message || 'An internal error occurred.'
    );
  }
});

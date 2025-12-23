import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuthorityDashboardPage() {
  return (
    <div className="container mx-auto flex items-center justify-center py-8">
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Welcome Sir/Ma'am</CardTitle>
          <CardDescription className="text-center text-xl text-muted-foreground pt-2">Authority Dashboard coming soon.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mt-4 rounded-lg border bg-muted/30 p-4">
            <h3 className="mb-2 font-semibold text-lg">Prompt for Next Task:</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap font-mono">
{`⚠️ Mandatory Constraints (Must Not Be Violated):

CampusConnect’s functionality must remain fully intact.

Do NOT modify or remove:

Issue reporting flow

AI prioritization logic (Genkit flows)

Firestore collections or document schemas

Real-time listeners (onSnapshot, useDoc, etc.)

Existing Server Actions (createIssueAction, updateIssueAction)

Only adapt UI placement and layout to match the target webpage structure.

Reuse existing Firebase providers, hooks, and authentication logic.

Merge Objective

Integrate CampusConnect’s Issue Tracking & Display logic into the existing webpage layout, ensuring visual consistency with the host page while preserving all backend, AI, and real-time behavior.

Data Access & Validation Logic
Fetch issue data from the Firestore issues collection using the Document ID.

Maintain real-time Firestore listeners where already used.

Show a loading spinner while fetching data.

If the Document ID does not exist, display: "Invalid Track ID"

AI Processing Condition

Render the issue card only if the field AI === 1.

If AI !== 1, display: "Issue is currently being processed by AI."

Issue Card Layout (Adapted to Host Page Structure)
The issue card must follow this strict content order, regardless of surrounding layout:

1️⃣ Image & Priority

Display imageUrls[0] as the main cover image.

Overlay a Priority Badge at the top-left corner:

🔴 Red → Critical

🟠 Orange → High

🟡 Yellow → Medium

🟢 Green → Low

2️⃣ Main Issue Content

Issue title (bold)

Issue description text below the title

3️⃣ Status Row

Display the current issue status with icon mapping:

Open → ✏️ Pen icon

In Progress → 🔧 Wrench icon

Resolved → ✅ Green Tick

Denied → ❌ Black Cross

4️⃣ Admin Feedback (Placement Change Required)

Move admin_comments below the Status Row

Treat this section as the latest administrative action

Keep it visually separated from user-submitted content

5️⃣ Admin Feedback Timestamp

Display updatedAt directly below admin_comments

Format as relative time (example: "Updated 10 minutes ago")

If updatedAt is missing or empty, render nothing

6️⃣ Footer

Show createdAt in the bottom-right corner

Format as relative time (example: "Reported 2 days ago")

UI & Design Alignment
Match the visual style of the host webpage

Use a clean, readable card layout

Preserve hierarchy:

Issue details → Status → Admin update → Timeline end

Ensure responsiveness across devices

Functional Integrity Requirements
Admin actions must still:

Update Firestore correctly

Trigger real-time UI updates

AI analysis data must remain untouched

Authentication and role-based rendering must behave exactly as before

UI Intent

This merge must clearly separate:

User-reported issue data

System-generated status

Admin feedback & update history

The admin feedback and updatedAt appearing after the status row should give a clear chronological history flow, without changing any existing logic.`}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

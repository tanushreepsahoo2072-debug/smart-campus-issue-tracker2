
'use server';
/**
 * @fileOverview This file defines the Genkit flow for processing a new complaint.
 * It uses AI to perform safety checks, classify, prioritize, and deduplicate complaints.
 *
 * - processComplaintFlow - The main flow function.
 * - ProcessComplaintInput - The Zod schema for the flow's input.
 * - ProcessComplaintOutput - The Zod schema for the flow's output.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define the schema for nearby issues, which will be used for deduplication.
const NearbyIssueSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    category: z.string(),
});

// Define the input schema for the complaint processing flow.
export const ProcessComplaintInputSchema = z.object({
  issueId: z.string().describe('The unique ID of the new complaint being processed.'),
  title: z.string().describe('The user-submitted title of the complaint.'),
  description: z.string().describe('The user-submitted description of the complaint.'),
  imageUrl: z.string().describe("A public URL to an image of the issue, hosted on ImgBB. Format: 'https://i.ibb.co/...'"),
  nearbyIssues: z.array(NearbyIssueSchema).describe('A list of other active complaints in the same geographic area to check for duplicates.'),
});
export type ProcessComplaintInput = z.infer<typeof ProcessComplaintInputSchema>;


// Define the output schema that the AI must return.
export const ProcessComplaintOutputSchema = z.object({
  is_spam: z.boolean().describe("Set to true if the image is inappropriate, a meme, AI-generated, or unrelated to campus maintenance."),
  is_duplicate: z.boolean().describe("Set to true if this issue is a clear duplicate of an item in the 'Nearby Issues' list."),
  duplicate_id: z.string().nullable().describe("If is_duplicate is true, this is the ID of the original issue. Otherwise, null."),
  category: z.enum(['Maintenance', 'Safety', 'IT Support', 'Landscaping', 'Facilities', 'Other', 'Electrical', 'Plumbing', '']).describe("Classify the issue into one of the provided categories. Leave empty if spam."),
  priority: z.enum(['Critical', 'High', 'Medium', 'Low', '']).describe("Assess the severity. Use 'Critical' for immediate safety risks. Leave empty if spam."),
  AI_COMMENT: z.string().describe("A brief, 1-sentence internal note explaining the decision, especially for denials or priority assessments."),
  status_update: z.enum(['Open', 'Denied']).describe("Set to 'Denied' if is_spam is true. Otherwise, set to 'Open'."),
});
export type ProcessComplaintOutput = z.infer<typeof ProcessComplaintOutputSchema>;


// Define the main prompt for Gemini 1.5 Flash.
const complaintProcessorPrompt = ai.definePrompt({
    name: 'complaintProcessorPrompt',
    input: { schema: ProcessComplaintInputSchema },
    output: { schema: ProcessComplaintOutputSchema },
    prompt: `You are an automated Campus Maintenance Dispatcher. Your goal is to process a new incident report and determine its validity and priority.
    
    New Complaint Details:
    - Title: {{{title}}}
    - Description: {{{description}}}
    - Image: {{media url=imageUrl}}

    Nearby Issues to check for duplicates:
    {{#if nearbyIssues.length}}
      {{#each nearbyIssues}}
      - ID: {{this.id}}, Title: "{{this.title}}", Description: "{{this.description}}", Category: {{this.category}}
      {{/each}}
    {{else}}
      No nearby issues were found.
    {{/if}}

    Perform the following tasks and return your decision ONLY in the specified JSON format.

    Task 1: Safety & Authenticity. Check the image. If it is offensive, a meme, a stock photo, clearly AI-generated, or completely unrelated to a plausible campus maintenance issue, set "is_spam" to true and "status_update" to "Denied". Provide a reason in "AI_COMMENT".

    Task 2: Deduplication. Compare the new complaint's image and description to the 'Nearby Issues' list. If it reports the exact same physical item (e.g., the same broken window, not just another broken window), set "is_duplicate" to true and "duplicate_id" to the ID of the original issue.

    Task 3: Classification. If the report is valid and unique, assign a "category" from this list: [Maintenance, Safety, IT Support, Landscaping, Facilities, Other, Electrical, Plumbing].

    Task 4: Severity. If valid and unique, assign a "priority" from this list: [Critical, High, Medium, Low]. Use 'Critical' only for immediate life-safety risks (e.g., sparking wires, major flooding visible in the image). Base your decision on the visual evidence.
    `,
    model: 'googleai/gemini-1.5-flash',
});


// Define the main flow that executes the prompt.
export const processComplaintFlow = ai.defineFlow(
  {
    name: 'processComplaintFlow',
    inputSchema: ProcessComplaintInputSchema,
    outputSchema: ProcessComplaintOutputSchema,
  },
  async (input) => {
    const { output } = await complaintProcessorPrompt(input);
    if (!output) {
        throw new Error("The AI model did not return a valid output.");
    }
    return output;
  }
);

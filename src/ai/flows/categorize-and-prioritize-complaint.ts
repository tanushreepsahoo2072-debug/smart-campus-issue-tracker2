'use server';

/**
 * @fileOverview An AI agent that categorizes and prioritizes complaints.
 *
 * - categorizeAndPrioritizeComplaint - A function that handles the complaint categorization and prioritization process.
 * - CategorizeAndPrioritizeComplaintInput - The input type for the categorizeAndPrioritizeComplaint function.
 * - CategorizeAndPrioritizeComplaintOutput - The return type for the categorizeAndPrioritizeComplaint function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CategorizeAndPrioritizeComplaintInputSchema = z.object({
  description: z.string().describe('The description of the complaint.'),
});
export type CategorizeAndPrioritizeComplaintInput = z.infer<
  typeof CategorizeAndPrioritizeComplaintInputSchema
>;

const CategorizeAndPrioritizeComplaintOutputSchema = z.object({
  category: z.string().describe('The category of the complaint.'),
  priority: z.string().describe('The priority of the complaint.'),
});
export type CategorizeAndPrioritizeComplaintOutput = z.infer<
  typeof CategorizeAndPrioritizeComplaintOutputSchema
>;

export async function categorizeAndPrioritizeComplaint(
  input: CategorizeAndPrioritizeComplaintInput
): Promise<CategorizeAndPrioritizeComplaintOutput> {
  return categorizeAndPrioritizeComplaintFlow(input);
}

const categorizeAndPrioritizeComplaintPrompt = ai.definePrompt({
  name: 'categorizeAndPrioritizeComplaintPrompt',
  input: {schema: CategorizeAndPrioritizeComplaintInputSchema},
  output: {schema: CategorizeAndPrioritizeComplaintOutputSchema},
  prompt: `You are an AI assistant specializing in categorizing and prioritizing public complaints based on their descriptions.

  Given the following complaint description, please determine the most appropriate category and priority.

  Description: {{{description}}}

  Please provide the category and priority in the following JSON format:
  {
    "category": "[category]",
    "priority": "[priority]"
  }
  `,
});

const categorizeAndPrioritizeComplaintFlow = ai.defineFlow(
  {
    name: 'categorizeAndPrioritizeComplaintFlow',
    inputSchema: CategorizeAndPrioritizeComplaintInputSchema,
    outputSchema: CategorizeAndPrioritizeComplaintOutputSchema,
  },
  async input => {
    const {output} = await categorizeAndPrioritizeComplaintPrompt(input);
    return output!;
  }
);

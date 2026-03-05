'use server';
/**
 * @fileOverview An AI agent that calculates optimal meeting points along a route.
 *
 * - calculateMeetingPoints - A function that suggests safety checkpoints and nearby guardians.
 * - MeetingPointsInput - The input type for the calculateMeetingPoints function.
 * - MeetingPointsOutput - The return type for the calculateMeetingPoints function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MeetingPointsInputSchema = z.object({
  startLocation: z.string().describe("The starting point of the journey."),
  destination: z.string().describe("The final destination of the journey."),
  availableContacts: z.array(z.object({
    id: z.string(),
    name: z.string(),
    relationship: z.string(),
  })).describe("The list of trusted contacts currently online and available in the network."),
});
export type MeetingPointsInput = z.infer<typeof MeetingPointsInputSchema>;

const MeetingPointsOutputSchema = z.object({
  meetingPoints: z.array(z.object({
    id: z.string(),
    pointName: z.string().describe("The name of the optimal meeting point."),
    description: z.string().describe("Why this point was chosen (e.g., proximity to a relative, safe public space)."),
    estimatedTimeFromStart: z.string().describe("Approximate time from the start of the journey."),
    nearbyGuardians: z.array(z.string()).describe("IDs of guardians who are within a 2km radius of this point."),
    safetyScore: z.number().describe("A score from 0-100 based on Curve-based and KNN proximity algorithms."),
  })),
});
export type MeetingPointsOutput = z.infer<typeof MeetingPointsOutputSchema>;

export async function calculateMeetingPoints(
  input: MeetingPointsInput
): Promise<MeetingPointsOutput> {
  return meetingPointsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'meetingPointsPrompt',
  input: {schema: MeetingPointsInputSchema},
  output: {schema: MeetingPointsOutputSchema},
  prompt: `You are an expert route safety analyzer for Setu Guardian. 
Your task is to calculate 2-3 optimal "Meeting Points" along the route from {{{startLocation}}} to {{{destination}}}.

Use a simulated Curve-based routing algorithm to find mid-points and a K-Nearest Neighbors (KNN) logic to check proximity of the following contacts:
{{#each availableContacts}}
- {{name}} (ID: {{id}}, Relationship: {{relationship}})
{{/each}}

Instructions:
1. Identify 2-3 logical safety checkpoints (e.g., "Central Metro Station", "Police Outpost", "Main Plaza").
2. Assign contacts to these points if their proximity is high.
3. Provide a safety score for each point based on lighting, public activity, and guardian availability.
4. Keep descriptions concise and technical.`,
});

const meetingPointsFlow = ai.defineFlow(
  {
    name: 'meetingPointsFlow',
    inputSchema: MeetingPointsInputSchema,
    outputSchema: MeetingPointsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

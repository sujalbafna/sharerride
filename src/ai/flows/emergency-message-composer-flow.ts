'use server';
/**
 * @fileOverview An AI agent that composes concise and personalized emergency messages.
 *
 * - generateEmergencyMessage - A function that generates an emergency message.
 * - EmergencyMessageComposerInput - The input type for the generateEmergencyMessage function.
 * - EmergencyMessageComposerOutput - The return type for the generateEmergencyMessage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EmergencyMessageComposerInputSchema = z.object({
  location: z
    .string()
    .describe(
      "The user's current physical location, e.g., '123 Main St, Anytown, USA' or 'Near Central Park entrance'."
    ),
  situation: z
    .string()
    .describe(
      "A brief description of the emergency situation, e.g., 'feeling unwell', 'car broke down', 'lost and disoriented'."
    ),
});
export type EmergencyMessageComposerInput = z.infer<
  typeof EmergencyMessageComposerInputSchema
>;

const EmergencyMessageComposerOutputSchema = z.object({
  message: z.string().describe('The concise and personalized emergency message.'),
});
export type EmergencyMessageComposerOutput = z.infer<
  typeof EmergencyMessageComposerOutputSchema
>;

export async function generateEmergencyMessage(
  input: EmergencyMessageComposerInput
): Promise<EmergencyMessageComposerOutput> {
  return emergencyMessageComposerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'emergencyMessageComposerPrompt',
  input: {schema: EmergencyMessageComposerInputSchema},
  output: {schema: EmergencyMessageComposerOutputSchema},
  prompt: `You are an AI assistant designed to compose urgent, concise, and personalized emergency messages for immediate dispatch to trusted contacts.

Given the user's current location and a description of the situation, generate a short, direct message asking for help. The message should be empathetic and convey urgency.

Instructions:
- Start with a clear call for help.
- State the location clearly.
- Briefly describe the situation.
- Keep the message to a maximum of 2-3 sentences.

Location: {{{location}}}
Situation: {{{situation}}}`,
});

const emergencyMessageComposerFlow = ai.defineFlow(
  {
    name: 'emergencyMessageComposerFlow',
    inputSchema: EmergencyMessageComposerInputSchema,
    outputSchema: EmergencyMessageComposerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

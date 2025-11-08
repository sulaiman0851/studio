'use server';

/**
 * @fileOverview AI suggestion helper for engineers to improve efficiency and effectiveness.
 *
 * - getAiSuggestion - A function that provides AI-driven suggestions based on the current job details.
 * - AiSuggestionInput - The input type for the getAiSuggestion function.
 * - AiSuggestionOutput - The return type for the getAiSuggestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiSuggestionInputSchema = z.object({
  jobType: z.string().describe('The type of job being performed (e.g., Installation, Troubleshoot).'),
  customerName: z.string().describe('The name of the customer.'),
  equipmentType: z.string().describe('The type of equipment being used (e.g., Modem, ONT).'),
  serialNumber: z.string().describe('The serial number of the equipment.'),
  powerRx: z.string().describe('The power R/X value.'),
  pppoeUsername: z.string().optional().describe('The PPPOE username, if applicable.'),
  pppoePassword: z.string().optional().describe('The PPPOE password, if applicable.'),
  ssid: z.string().optional().describe('The SSID of the network, if applicable.'),
  wlanKey: z.string().optional().describe('The WLAN key, if applicable.'),
  reason: z.string().optional().describe('The reason for the job, if applicable.'),
});
export type AiSuggestionInput = z.infer<typeof AiSuggestionInputSchema>;

const AiSuggestionOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('A list of AI-driven suggestions to improve efficiency and effectiveness.'),
});
export type AiSuggestionOutput = z.infer<typeof AiSuggestionOutputSchema>;

export async function getAiSuggestion(input: AiSuggestionInput): Promise<AiSuggestionOutput> {
  return aiSuggestionFlow(input);
}

const aiSuggestionPrompt = ai.definePrompt({
  name: 'aiSuggestionPrompt',
  input: {schema: AiSuggestionInputSchema},
  output: {schema: AiSuggestionOutputSchema},
  prompt: `You are an AI assistant providing suggestions to field engineers to improve their work efficiency and effectiveness during FTTH (Fiber To The Home) job tasks.

  Based on the job details provided, offer specific, actionable suggestions that the engineer can follow.
  Consider the job type, customer information, equipment details, and any other relevant information to tailor your suggestions.

  Job Type: {{{jobType}}}
  Customer Name: {{{customerName}}}
  Equipment Type: {{{equipmentType}}}
  Serial Number: {{{serialNumber}}}
  Power R/X: {{{powerRx}}}
  PPPOE Username: {{{pppoeUsername}}}
  PPPOE Password: {{{pppoePassword}}}
  SSID: {{{ssid}}}
  WLAN Key: {{{wlanKey}}}
  Reason: {{{reason}}}

  Provide suggestions as a list of strings.
  Ensure the suggestions are clear, concise, and directly relevant to the provided job details.
`,
});

const aiSuggestionFlow = ai.defineFlow(
  {
    name: 'aiSuggestionFlow',
    inputSchema: AiSuggestionInputSchema,
    outputSchema: AiSuggestionOutputSchema,
  },
  async input => {
    const {output} = await aiSuggestionPrompt(input);
    return output!;
  }
);

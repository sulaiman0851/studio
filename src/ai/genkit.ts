import { genkit } from 'genkit';
import { googleAI, gemini15Flash } from '@genkit-ai/google-genai';

// Initialize Genkit with Google AI plugin
const ai = genkit({
  plugins: [googleAI()],
});

export async function generateImageCaption(imageDataUrl: string): Promise<string> {
  try {
    const { text } = await ai.generate({
      model: gemini15Flash,
      prompt: [
        { text: 'Analyze this image for a field report. Provide a concise, professional caption describing the work activity, site condition, or key objects visible. Keep it under 20 words.' },
        { media: { url: imageDataUrl } },
      ],
    });
    return text;
  } catch (error) {
    console.error('Genkit Error:', error);
    return ''; // Return empty string on failure so upload doesn't fail
  }
}

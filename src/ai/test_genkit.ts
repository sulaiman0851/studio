import { generateImageCaption } from './genkit';
import * as dotenv from 'dotenv';

// Load env vars
dotenv.config({ path: '.env.local' });

async function test() {
  console.log('Checking API Key...');
  if (!process.env.GOOGLE_GENAI_API_KEY) {
    console.error('ERROR: GOOGLE_GENAI_API_KEY is not set in process.env');
    return;
  }
  console.log('API Key is set (starts with):', process.env.GOOGLE_GENAI_API_KEY.substring(0, 5) + '...');

  console.log('Testing generateImageCaption...');
  const sampleImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  
  try {
    const caption = await generateImageCaption(sampleImage);
    console.log('Result:', caption);
    if (!caption) {
      console.log('Caption is empty. Check previous error logs.');
    }
  } catch (e) {
    console.error('Test failed:', e);
  }
}

test();

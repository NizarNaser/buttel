import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
    // We'll allow it for now so the app doesn't crash on build if the key is missing
    console.warn('OPENAI_API_KEY is not defined');
}

export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || ''
});

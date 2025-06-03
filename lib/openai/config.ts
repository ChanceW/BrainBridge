import OpenAI from 'openai';

// OpenAI Configuration
export const OPENAI_CONFIG = {
  model: 'gpt-3.5-turbo', // Using gpt-3.5-turbo as it's more widely available
  temperature: 0.7, // Default temperature for creative outputs
  maxRetries: 3, // Maximum number of retries for failed requests
  timeout: 60000, // Increased timeout to 60 seconds
  questionCount: 10, // Reduced from 20 to 10 questions per worksheet for faster generation
  rateLimits: {
    requestsPerMinute: 5, // Increased from 2 to 5 requests per minute
    requestsPerHour: 100, // Increased from 40 to 100 requests per hour
    retryDelay: 1000, // Reduced from 2000 to 1000ms for faster retries
  }
}

// Initialize OpenAI client
let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.');
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: OPENAI_CONFIG.timeout,
      maxRetries: OPENAI_CONFIG.maxRetries,
    });
  }

  return openaiClient;
} 
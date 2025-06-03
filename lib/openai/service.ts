import { getOpenAIClient, OPENAI_CONFIG } from './config';
import { APIError } from 'openai';
import { openAIRateLimiter } from './rateLimiter';

export interface QuestionGenerationParams {
  category: string;
  interest: string;
  grade: number;
  count?: number;
}

export interface GeneratedQuestion {
  content: string;
  options: string[];
  answer: string;
  explanation: string;
}

export class OpenAIService {
  private static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = OPENAI_CONFIG.maxRetries,
    initialDelay: number = OPENAI_CONFIG.rateLimits.retryDelay
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Wait for rate limiter before each attempt
        await openAIRateLimiter.waitForAvailability();
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.error(`Attempt ${attempt + 1} failed:`, error);
        
        if (error instanceof APIError) {
          // Don't retry on certain errors
          if (['invalid_api_key', 'model_not_found'].includes(error.code || '')) {
            throw error;
          }
          
          // If it's a rate limit error, wait longer
          if (error.code === 'rate_limit_exceeded' || error.status === 429) {
            const delay = initialDelay * Math.pow(2, attempt);
            console.log(`Rate limit hit. Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        
        // For other errors, use standard backoff
        if (attempt < maxRetries - 1) {
          const delay = initialDelay * Math.pow(2, attempt);
          console.log(`Request failed. Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('Operation failed after retries');
  }

  private static async generateQuestionBatch(
    params: QuestionGenerationParams,
    batchSize: number
  ): Promise<GeneratedQuestion[]> {
    const openai = getOpenAIClient();

    const prompt = `Generate ${batchSize} multiple-choice educational questions for a grade ${params.grade} student.
    Subject: ${params.category}
    Theme/Interest: ${params.interest}

    Requirements:
    - Each question should be grade-appropriate
    - Include 4 options for each question
    - One option must be the correct answer
    - Provide a clear explanation for the correct answer
    - Make questions engaging and related to the student's interest in ${params.interest}
    - For Math questions, include age-appropriate calculations
    - For other subjects, ensure factual accuracy and educational value

    Format each question as a JSON object with:
    - content: the question text
    - options: array of 4 possible answers
    - answer: the correct answer (must match one of the options exactly)
    - explanation: detailed explanation of the correct answer

    Return as a JSON array of question objects.`;

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert educational content creator, specializing in creating engaging, age-appropriate questions that combine academic subjects with students' interests."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: OPENAI_CONFIG.model,
      response_format: { type: "json_object" },
      temperature: OPENAI_CONFIG.temperature,
    });

    const parsed = JSON.parse(completion.choices[0].message.content || '{"questions": []}');
    
    if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      throw new Error('Invalid response format from AI model');
    }

    return parsed.questions;
  }

  static async generateQuestions(params: QuestionGenerationParams): Promise<GeneratedQuestion[]> {
    const count = params.count || OPENAI_CONFIG.questionCount;
    const batchSize = 10; // Increased from 5 to 10 questions per batch
    const batches = Math.ceil(count / batchSize);
    const questions: GeneratedQuestion[] = [];

    try {
      for (let i = 0; i < batches; i++) {
        const remainingQuestions = count - questions.length;
        const currentBatchSize = Math.min(batchSize, remainingQuestions);
        
        console.log(`Generating batch ${i + 1}/${batches} (${currentBatchSize} questions)...`);
        
        const batchQuestions = await this.retryWithBackoff(() => 
          this.generateQuestionBatch({ ...params, count: currentBatchSize }, currentBatchSize)
        );
        
        questions.push(...batchQuestions);
        
        // Add a smaller delay between batches
        if (i < batches - 1) {
          await new Promise(resolve => setTimeout(resolve, 500)); // Reduced from 1000ms to 500ms
        }
      }

      return questions;
    } catch (error) {
      console.error('Error generating questions with AI:', error);
      
      if (error instanceof APIError) {
        switch (error.code) {
          case 'model_not_found':
            throw new Error('The AI model is currently unavailable. Please try again later or contact support.');
          case 'invalid_api_key':
            throw new Error('Invalid API key. Please check your OpenAI API key configuration.');
          case 'rate_limit_exceeded':
            throw new Error('Service is busy. Please try again in a few moments.');
          default:
            if (error.status === 429) {
              throw new Error('Service is busy. Please try again in a few moments.');
            }
        }
      }

      throw new Error('Failed to generate questions. Please try again later.');
    }
  }

  static async validateQuestion(question: string, grade: number): Promise<boolean> {
    const openai = getOpenAIClient();

    try {
      return await this.retryWithBackoff(async () => {
        const completion = await openai.chat.completions.create({
          messages: [
            {
              role: "system",
              content: "You are an expert in educational content validation."
            },
            {
              role: "user",
              content: `Please validate if this question is appropriate for grade ${grade} students. Consider:\n1. Age-appropriate language\n2. Difficulty level\n3. Educational value\n\nQuestion: ${question}\n\nRespond with a JSON object containing only a boolean 'isValid' field.`
            }
          ],
          model: OPENAI_CONFIG.model,
          response_format: { type: "json_object" },
          temperature: 0.1,
        });

        const response = JSON.parse(completion.choices[0].message.content || '{"isValid": false}');
        return response.isValid;
      });
    } catch (error) {
      console.error('Error validating question:', error);
      
      if (error instanceof APIError) {
        switch (error.code) {
          case 'model_not_found':
            console.error('AI model unavailable');
            break;
          case 'invalid_api_key':
            console.error('Invalid API key');
            break;
          case 'rate_limit_exceeded':
            console.error('Rate limit exceeded');
            break;
        }
      }
      
      return false;
    }
  }
} 
import OpenAI from 'openai';

let openai: OpenAI | null = null;

// Initialize OpenAI client only if API key is available
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

interface QuestionGenerationParams {
  category: string;
  interest: string;
  grade: number;
  count: number;
}

interface GeneratedQuestion {
  content: string;
  options: string[];
  answer: string;
  explanation: string;
}

export async function generateAIQuestions({
  category,
  interest,
  grade,
  count,
}: QuestionGenerationParams): Promise<GeneratedQuestion[]> {
  if (!openai) {
    throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.');
  }

  const prompt = `Generate ${count} multiple-choice educational questions for a grade ${grade} student.
  Subject: ${category}
  Theme/Interest: ${interest}

  Requirements:
  - Each question should be grade-appropriate
  - Include 4 options for each question
  - One option must be the correct answer
  - Provide a clear explanation for the correct answer
  - Make questions engaging and related to the student's interest in ${interest}
  - For Math questions, include age-appropriate calculations
  - For other subjects, ensure factual accuracy and educational value

  Format each question as a JSON object with:
  - content: the question text
  - options: array of 4 possible answers
  - answer: the correct answer (must match one of the options exactly)
  - explanation: detailed explanation of the correct answer

  Return as a JSON array of question objects.`;

  try {
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
      model: "gpt-4",
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const response = JSON.parse(completion.choices[0].message.content || '{"questions": []}');
    return response.questions;
  } catch (error) {
    console.error('Error generating questions with AI:', error);
    throw new Error('Failed to generate questions. Please try again later.');
  }
} 
import { generateAIQuestions } from '@/lib/openai'

// Mock the OpenAI API
jest.mock('openai', () => {
  const mockChatCompletions = {
    create: jest.fn().mockImplementation(async () => ({
      choices: [{
        message: {
          content: JSON.stringify({
            questions: [
              {
                content: 'What is 2 + 2?',
                options: ['3', '4', '5', '6'],
                answer: '4',
                explanation: 'To solve 2 + 2, we add the numbers together. 2 + 2 = 4'
              }
            ]
          })
        }
      }]
    }))
  };

  const mockChat = {
    completions: mockChatCompletions
  };

  // The mock constructor will throw if no API key is present
  const mockOpenAI = jest.fn().mockImplementation(({ apiKey }) => {
    if (!apiKey) {
      throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.');
    }
    return { chat: mockChat };
  });

  return {
    __esModule: true,
    default: mockOpenAI
  };
});

describe('OpenAI Integration', () => {
  const mockParams = {
    category: 'Math',
    interest: 'Space',
    grade: 3,
    count: 1
  }

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-api-key';
  });

  it('should generate questions with the correct structure', async () => {
    const { generateAIQuestions } = require('@/lib/openai');
    const result = await generateAIQuestions(mockParams)
    expect(result).toEqual([
      {
        content: 'What is 2 + 2?',
        options: ['3', '4', '5', '6'],
        answer: '4',
        explanation: 'To solve 2 + 2, we add the numbers together. 2 + 2 = 4'
      }
    ])
  })

  it('should handle API errors gracefully', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    const mockOpenAI = require('openai').default
    mockOpenAI.mockImplementationOnce(() => ({
      chat: {
        completions: {
          create: jest.fn().mockRejectedValue(new Error('API Error'))
        }
      }
    }))
    const { generateAIQuestions } = require('@/lib/openai');
    await expect(generateAIQuestions(mockParams))
      .rejects
      .toThrow('Failed to generate questions. Please try again later.')
  })

  it('should throw error when OpenAI API key is not configured', async () => {
    delete process.env.OPENAI_API_KEY
    jest.resetModules();
    const { generateAIQuestions } = require('@/lib/openai');
    await expect(generateAIQuestions(mockParams))
      .rejects
      .toThrow('OpenAI API key not configured')
  })
}) 
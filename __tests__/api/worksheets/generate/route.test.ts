import { NextRequest } from 'next/server'
import { POST } from '@/app/api/worksheets/generate/route'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { OpenAIService } from '@/lib/openai/service'

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    student: {
      findFirst: jest.fn(),
    },
    worksheet: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}))

// Mock OpenAI service
jest.mock('@/lib/openai/service', () => ({
  OpenAIService: {
    generateQuestions: jest.fn(),
  },
}))

describe('Worksheet Generation API', () => {
  const mockSession = {
    user: {
      email: 'student@example.com',
    },
  }

  const mockStudent = {
    id: '1',
    name: 'Test Student',
    userName: 'student@example.com',
    grade: 3,
    categories: ['Math', 'Science'],
    interests: ['Sports', 'Animals'],
  }

  const mockQuestions = [
    {
      content: 'What is 2 + 2?',
      options: ['3', '4', '5', '6'],
      answer: '4',
      explanation: '2 + 2 = 4',
    },
    {
      content: 'What is 3 * 3?',
      options: ['6', '7', '8', '9'],
      answer: '9',
      explanation: '3 * 3 = 9',
    },
  ]

  const mockWorksheet = {
    id: '1',
    title: 'Math Practice - Sports Theme',
    description: 'A personalized worksheet focusing on Math with Sports-themed questions.',
    subject: 'Math',
    grade: 3,
    studentId: '1',
    status: 'NOT_STARTED',
    score: null,
    startedAt: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    questions: mockQuestions.map(q => ({
      id: '1',
      ...q,
      studentAnswer: null,
      isCorrect: null,
    })),
  }

  const mockRequest = {
    json: jest.fn().mockImplementation(() => Promise.resolve({})),
  } as unknown as NextRequest

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(prisma.student.findFirst as jest.Mock).mockResolvedValue(mockStudent)
    ;(prisma.worksheet.findFirst as jest.Mock).mockResolvedValue(null)
    ;(OpenAIService.generateQuestions as jest.Mock).mockResolvedValue(mockQuestions)
    ;(prisma.worksheet.create as jest.Mock).mockResolvedValue(mockWorksheet)
  })

  it('should return 401 if not authenticated', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data).toEqual({ error: 'Unauthorized' })
  })

  it('should return 404 if student not found', async () => {
    ;(prisma.student.findFirst as jest.Mock).mockResolvedValue(null)

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data).toEqual({ error: 'Student not found' })
  })

  it('should return 400 if student has no categories', async () => {
    const studentWithoutCategories = {
      ...mockStudent,
      categories: [],
    }

    ;(prisma.student.findFirst as jest.Mock).mockResolvedValue(studentWithoutCategories)

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toEqual({ error: 'Student must have at least one category selected' })
  })

  it('should return 400 if student has no interests', async () => {
    const studentWithoutInterests = {
      ...mockStudent,
      interests: [],
    }

    ;(prisma.student.findFirst as jest.Mock).mockResolvedValue(studentWithoutInterests)

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toEqual({ error: 'Student must have at least one interest selected' })
  })

  it('should return 400 if there is an incomplete worksheet for today', async () => {
    const existingWorksheet = {
      ...mockWorksheet,
      status: 'IN_PROGRESS',
    }

    ;(prisma.worksheet.findFirst as jest.Mock).mockResolvedValue(existingWorksheet)

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toEqual({
      error: 'You have an incomplete worksheet for today. Please complete it first or use the "Generate New Worksheet" button.',
    })
  })

  it('should generate new worksheet when force is true', async () => {
    const existingWorksheet = {
      ...mockWorksheet,
      status: 'IN_PROGRESS',
    }

    ;(prisma.worksheet.findFirst as jest.Mock).mockResolvedValue(existingWorksheet)
    ;(mockRequest.json as jest.Mock).mockResolvedValue({ force: true })

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual(mockWorksheet)
    expect(OpenAIService.generateQuestions).toHaveBeenCalledWith({
      category: expect.any(String),
      interest: expect.any(String),
      grade: mockStudent.grade,
    })
    expect(prisma.worksheet.create).toHaveBeenCalledWith({
      data: {
        title: expect.stringContaining('Practice'),
        description: expect.stringContaining('personalized worksheet'),
        subject: expect.any(String),
        grade: mockStudent.grade,
        studentId: mockStudent.id,
        questions: {
          create: mockQuestions,
        },
      },
      include: {
        questions: true,
      },
    })
  })

  it('should handle OpenAI service errors', async () => {
    const error = new Error('API key is invalid')
    ;(OpenAIService.generateQuestions as jest.Mock).mockRejectedValue(error)

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data).toEqual({
      error: 'Service configuration error. Please contact support.',
    })
  })

  it('should handle rate limit errors', async () => {
    const error = new Error('rate limit exceeded')
    ;(OpenAIService.generateQuestions as jest.Mock).mockRejectedValue(error)

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data).toEqual({
      error: 'Service is busy. Please try again in a few moments.',
    })
  })

  it('should handle no questions generated', async () => {
    ;(OpenAIService.generateQuestions as jest.Mock).mockResolvedValue([])

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toEqual({
      error: 'No questions were generated. Please try again.',
    })
  })
}) 
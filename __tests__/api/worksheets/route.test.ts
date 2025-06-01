import { NextRequest } from 'next/server'
import { GET, PUT } from '@/app/api/worksheets/route'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'

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
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}))

describe('Worksheets API', () => {
  const mockSession = {
    user: {
      email: 'test@example.com',
    },
  }

  const mockStudent = {
    id: '1',
    name: 'Test Student',
    userName: 'test@example.com',
  }

  const mockWorksheet = {
    id: '1',
    title: 'Test Worksheet',
    description: 'Test Description',
    subject: 'Math',
    grade: 3,
    status: 'NOT_STARTED',
    score: null,
    startedAt: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    questions: [
      {
        id: '1',
        content: 'What is 2 + 2?',
        options: ['3', '4', '5', '6'],
        answer: '4',
        explanation: '2 + 2 = 4',
        studentAnswer: null,
        isCorrect: null,
      },
    ],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(prisma.student.findFirst as jest.Mock).mockResolvedValue(mockStudent)
  })

  describe('GET /api/worksheets', () => {
    it('should return 401 if not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Unauthorized' })
    })

    it('should return 404 if student not found', async () => {
      ;(prisma.student.findFirst as jest.Mock).mockResolvedValue(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data).toEqual({ error: 'Student not found' })
    })

    it('should return current and previous worksheets', async () => {
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      const worksheets = [
        { ...mockWorksheet, status: 'IN_PROGRESS', createdAt: today },
        { ...mockWorksheet, id: '2', status: 'COMPLETED', createdAt: today },
        { ...mockWorksheet, id: '3', status: 'NOT_STARTED', createdAt: yesterday },
      ]

      ;(prisma.worksheet.findMany as jest.Mock).mockResolvedValue(worksheets)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        currentWorksheet: worksheets[0],
        previousWorksheets: [worksheets[1], worksheets[2]],
      })
    })
  })

  describe('PUT /api/worksheets', () => {
    const mockRequest = {
      json: jest.fn().mockImplementation(() => Promise.resolve({})),
    } as unknown as NextRequest

    it('should return 401 if not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const response = await PUT(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Unauthorized' })
    })

    it('should return 404 if student not found', async () => {
      ;(prisma.student.findFirst as jest.Mock).mockResolvedValue(null)

      const response = await PUT(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data).toEqual({ error: 'Student not found' })
    })

    it('should return 404 if worksheet not found', async () => {
      ;(prisma.worksheet.findFirst as jest.Mock).mockResolvedValue(null)
      ;(mockRequest.json as jest.Mock).mockResolvedValue({ worksheetId: '1' })

      const response = await PUT(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data).toEqual({ error: 'Worksheet not found' })
    })

    it('should reset worksheet progress', async () => {
      const worksheet = {
        ...mockWorksheet,
        questions: [{ id: '1', answer: '4' }],
      }

      ;(prisma.worksheet.findFirst as jest.Mock).mockResolvedValue(worksheet)
      ;(prisma.worksheet.update as jest.Mock).mockResolvedValue({
        ...worksheet,
        status: 'NOT_STARTED',
        score: null,
        startedAt: null,
        completedAt: null,
        questions: [{
          ...worksheet.questions[0],
          studentAnswer: null,
          isCorrect: null,
        }],
      })

      ;(mockRequest.json as jest.Mock).mockResolvedValue({
        worksheetId: '1',
        reset: true,
      })

      const response = await PUT(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('NOT_STARTED')
      expect(data.score).toBeNull()
      expect(data.startedAt).toBeNull()
      expect(data.completedAt).toBeNull()
      expect(data.questions[0].studentAnswer).toBeNull()
      expect(data.questions[0].isCorrect).toBeNull()
    })

    it('should update worksheet status and calculate score', async () => {
      const worksheet = {
        ...mockWorksheet,
        questions: [
          { id: '1', answer: '4' },
          { id: '2', answer: '6' },
        ],
      }

      ;(prisma.worksheet.findFirst as jest.Mock).mockResolvedValue(worksheet)
      ;(prisma.worksheet.update as jest.Mock).mockResolvedValue({
        ...worksheet,
        status: 'COMPLETED',
        score: 50,
        startedAt: new Date(),
        completedAt: new Date(),
        questions: [
          { ...worksheet.questions[0], studentAnswer: '4', isCorrect: true },
          { ...worksheet.questions[1], studentAnswer: '5', isCorrect: false },
        ],
      })

      ;(mockRequest.json as jest.Mock).mockResolvedValue({
        worksheetId: '1',
        status: 'COMPLETED',
        answers: ['4', '5'],
      })

      const response = await PUT(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('COMPLETED')
      expect(data.score).toBe(50)
      expect(data.startedAt).toBeTruthy()
      expect(data.completedAt).toBeTruthy()
      expect(data.questions[0].studentAnswer).toBe('4')
      expect(data.questions[0].isCorrect).toBe(true)
      expect(data.questions[1].studentAnswer).toBe('5')
      expect(data.questions[1].isCorrect).toBe(false)
    })
  })
}) 
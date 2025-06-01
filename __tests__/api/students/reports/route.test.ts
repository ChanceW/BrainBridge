import { GET } from '@/app/api/students/reports/route'
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
      findMany: jest.fn(),
    },
  },
}))

describe('Student Reports API', () => {
  const mockSession = {
    user: {
      email: 'parent@example.com',
    },
  }

  const mockWorksheets = [
    {
      id: '1',
      title: 'Math Worksheet 1',
      subject: 'Math',
      status: 'COMPLETED',
      score: 80,
      startedAt: new Date('2024-01-01'),
      completedAt: new Date('2024-01-01'),
      createdAt: new Date('2024-01-01'),
      questions: [
        {
          id: '1',
          content: 'What is 2 + 2?',
          options: ['3', '4', '5', '6'],
          answer: '4',
          explanation: '2 + 2 = 4',
          studentAnswer: '4',
          isCorrect: true,
        },
      ],
    },
    {
      id: '2',
      title: 'Science Worksheet 1',
      subject: 'Science',
      status: 'COMPLETED',
      score: 90,
      startedAt: new Date('2024-01-02'),
      completedAt: new Date('2024-01-02'),
      createdAt: new Date('2024-01-02'),
      questions: [
        {
          id: '2',
          content: 'What is the capital of France?',
          options: ['London', 'Berlin', 'Paris', 'Madrid'],
          answer: 'Paris',
          explanation: 'Paris is the capital of France',
          studentAnswer: 'Paris',
          isCorrect: true,
        },
      ],
    },
    {
      id: '3',
      title: 'Math Worksheet 2',
      subject: 'Math',
      status: 'IN_PROGRESS',
      score: null,
      startedAt: new Date('2024-01-03'),
      completedAt: null,
      createdAt: new Date('2024-01-03'),
      questions: [
        {
          id: '3',
          content: 'What is 3 * 3?',
          options: ['6', '7', '8', '9'],
          answer: '9',
          explanation: '3 * 3 = 9',
          studentAnswer: null,
          isCorrect: null,
        },
      ],
    },
  ]

  const mockStudents = [
    {
      id: '1',
      name: 'Test Student 1',
      userName: 'test1@example.com',
      grade: 3,
      categories: ['Math', 'Science'],
      worksheets: mockWorksheets,
    },
    {
      id: '2',
      name: 'Test Student 2',
      userName: 'test2@example.com',
      grade: 4,
      categories: ['Math'],
      worksheets: [mockWorksheets[0]], // Only has one completed worksheet
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(prisma.student.findMany as jest.Mock).mockResolvedValue(mockStudents)
  })

  it('should return 401 if not authenticated', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data).toEqual({ error: 'Unauthorized' })
  })

  it('should return student reports with correct calculations', async () => {
    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveLength(2)

    // Test first student's report
    const student1Report = data[0]
    expect(student1Report).toEqual({
      id: '1',
      name: 'Test Student 1',
      userName: 'test1@example.com',
      grade: 3,
      categories: ['Math', 'Science'],
      totalWorksheets: 3,
      completedWorksheets: 2,
      averageScore: 85, // (80 + 90) / 2
      subjectAverages: [
        { subject: 'Math', averageScore: 80 },
        { subject: 'Science', averageScore: 90 },
      ],
      recentWorksheets: mockWorksheets.slice(0, 5), // Last 5 worksheets
    })

    // Test second student's report
    const student2Report = data[1]
    expect(student2Report).toEqual({
      id: '2',
      name: 'Test Student 2',
      userName: 'test2@example.com',
      grade: 4,
      categories: ['Math'],
      totalWorksheets: 1,
      completedWorksheets: 1,
      averageScore: 80,
      subjectAverages: [
        { subject: 'Math', averageScore: 80 },
      ],
      recentWorksheets: [mockWorksheets[0]], // Only has one worksheet
    })
  })

  it('should handle students with no worksheets', async () => {
    const studentsWithNoWorksheets = [
      {
        ...mockStudents[0],
        worksheets: [],
      },
    ]

    ;(prisma.student.findMany as jest.Mock).mockResolvedValue(studentsWithNoWorksheets)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveLength(1)

    const report = data[0]
    expect(report).toEqual({
      id: '1',
      name: 'Test Student 1',
      userName: 'test1@example.com',
      grade: 3,
      categories: ['Math', 'Science'],
      totalWorksheets: 0,
      completedWorksheets: 0,
      averageScore: null,
      subjectAverages: [],
      recentWorksheets: [],
    })
  })

  it('should handle students with no completed worksheets', async () => {
    const studentsWithInProgressWorksheets = [
      {
        ...mockStudents[0],
        worksheets: [mockWorksheets[2]], // Only has one in-progress worksheet
      },
    ]

    ;(prisma.student.findMany as jest.Mock).mockResolvedValue(studentsWithInProgressWorksheets)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveLength(1)

    const report = data[0]
    expect(report).toEqual({
      id: '1',
      name: 'Test Student 1',
      userName: 'test1@example.com',
      grade: 3,
      categories: ['Math', 'Science'],
      totalWorksheets: 1,
      completedWorksheets: 0,
      averageScore: null,
      subjectAverages: [],
      recentWorksheets: [mockWorksheets[2]],
    })
  })
}) 
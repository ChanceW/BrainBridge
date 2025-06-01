import { NextRequest } from 'next/server'
import { GET, POST, PUT, DELETE } from '@/app/api/students/route'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'

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
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    parent: {
      findUnique: jest.fn(),
    },
  },
}))

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}))

describe('Students API', () => {
  const mockSession = {
    user: {
      email: 'parent@example.com',
    },
  }

  const mockParent = {
    id: '1',
    email: 'parent@example.com',
  }

  const mockStudent = {
    id: '1',
    name: 'Test Student',
    userName: 'test@example.com',
    grade: 3,
    categories: ['Math', 'Science'],
    interests: ['Reading', 'Sports'],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(prisma.parent.findUnique as jest.Mock).mockResolvedValue(mockParent)
    ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password')
  })

  describe('GET /api/students', () => {
    it('should return 401 if not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Unauthorized' })
    })

    it('should return list of students for parent', async () => {
      const students = [mockStudent]
      ;(prisma.student.findMany as jest.Mock).mockResolvedValue(students)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(students)
      expect(prisma.student.findMany).toHaveBeenCalledWith({
        where: {
          parent: {
            email: mockSession.user.email,
          },
        },
        select: {
          id: true,
          name: true,
          userName: true,
          grade: true,
          categories: true,
          interests: true,
        },
      })
    })
  })

  describe('POST /api/students', () => {
    const mockRequest = {
      json: jest.fn().mockImplementation(() => Promise.resolve({})),
    } as unknown as NextRequest

    it('should return 401 if not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Unauthorized' })
    })

    it('should return 404 if parent not found', async () => {
      ;(prisma.parent.findUnique as jest.Mock).mockResolvedValue(null)
      ;(mockRequest.json as jest.Mock).mockResolvedValue({
        name: 'New Student',
        userName: 'new@example.com',
        grade: 4,
        password: 'password123',
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data).toEqual({ error: 'Parent not found' })
    })

    it('should return 400 if username is taken', async () => {
      ;(prisma.student.findUnique as jest.Mock).mockResolvedValue(mockStudent)
      ;(mockRequest.json as jest.Mock).mockResolvedValue({
        name: 'New Student',
        userName: 'test@example.com', // Same as mockStudent
        grade: 4,
        password: 'password123',
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Username already taken' })
    })

    it('should create new student', async () => {
      const newStudent = {
        ...mockStudent,
        id: '2',
        userName: 'new@example.com',
      }

      ;(prisma.student.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.student.create as jest.Mock).mockResolvedValue(newStudent)
      ;(mockRequest.json as jest.Mock).mockResolvedValue({
        name: 'New Student',
        userName: 'new@example.com',
        grade: 4,
        password: 'password123',
        categories: ['Math'],
        interests: ['Reading'],
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(newStudent)
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10)
      expect(prisma.student.create).toHaveBeenCalledWith({
        data: {
          name: 'New Student',
          userName: 'new@example.com',
          grade: 4,
          password: 'hashed_password',
          categories: ['Math'],
          interests: ['Reading'],
          parentId: mockParent.id,
        },
        select: {
          id: true,
          name: true,
          userName: true,
          grade: true,
          categories: true,
          interests: true,
        },
      })
    })
  })

  describe('PUT /api/students', () => {
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
      ;(mockRequest.json as jest.Mock).mockResolvedValue({
        id: '1',
        name: 'Updated Student',
        userName: 'updated@example.com',
      })

      const response = await PUT(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data).toEqual({ error: 'Student not found' })
    })

    it('should return 400 if new username is taken', async () => {
      const otherStudent = {
        ...mockStudent,
        id: '2',
        userName: 'other@example.com',
      }

      ;(prisma.student.findFirst as jest.Mock).mockResolvedValue(mockStudent)
      ;(prisma.student.findUnique as jest.Mock).mockResolvedValue(otherStudent)
      ;(mockRequest.json as jest.Mock).mockResolvedValue({
        id: '1',
        name: 'Updated Student',
        userName: 'other@example.com', // Same as otherStudent
      })

      const response = await PUT(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Username already taken' })
    })

    it('should update student', async () => {
      const updatedStudent = {
        ...mockStudent,
        name: 'Updated Student',
        userName: 'updated@example.com',
      }

      ;(prisma.student.findFirst as jest.Mock).mockResolvedValue(mockStudent)
      ;(prisma.student.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.student.update as jest.Mock).mockResolvedValue(updatedStudent)
      ;(mockRequest.json as jest.Mock).mockResolvedValue({
        id: '1',
        name: 'Updated Student',
        userName: 'updated@example.com',
        grade: 4,
        categories: ['Math', 'Science', 'History'],
        interests: ['Reading', 'Sports', 'Music'],
      })

      const response = await PUT(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(updatedStudent)
      expect(prisma.student.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          name: 'Updated Student',
          userName: 'updated@example.com',
          grade: 4,
          categories: ['Math', 'Science', 'History'],
          interests: ['Reading', 'Sports', 'Music'],
        },
        select: {
          id: true,
          name: true,
          userName: true,
          grade: true,
          categories: true,
          interests: true,
        },
      })
    })
  })

  describe('DELETE /api/students', () => {
    const mockRequest = {
      url: 'http://localhost:3000/api/students?id=1',
    } as unknown as NextRequest

    it('should return 401 if not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const response = await DELETE(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Unauthorized' })
    })

    it('should return 400 if student ID is missing', async () => {
      const request = {
        url: 'http://localhost:3000/api/students',
      } as unknown as NextRequest

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Student ID is required' })
    })

    it('should return 404 if student not found', async () => {
      ;(prisma.student.findFirst as jest.Mock).mockResolvedValue(null)

      const response = await DELETE(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data).toEqual({ error: 'Student not found' })
    })

    it('should delete student', async () => {
      ;(prisma.student.findFirst as jest.Mock).mockResolvedValue(mockStudent)
      ;(prisma.student.delete as jest.Mock).mockResolvedValue(mockStudent)

      const response = await DELETE(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ success: true })
      expect(prisma.student.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      })
    })
  })
}) 
import { NextRequest } from 'next/server'
import { PUT } from '@/app/api/students/reset-password/route'
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
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}))

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}))

describe('Student Reset Password API', () => {
  const mockSession = {
    user: {
      email: 'parent@example.com',
    },
  }

  const mockStudent = {
    id: '1',
    name: 'Test Student',
    userName: 'test@example.com',
    parent: {
      email: 'parent@example.com',
    },
  }

  const mockRequest = {
    json: jest.fn().mockImplementation(() => Promise.resolve({})),
  } as unknown as NextRequest

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(prisma.student.findFirst as jest.Mock).mockResolvedValue(mockStudent)
    ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password')
  })

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
      password: 'new_password',
    })

    const response = await PUT(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data).toEqual({ error: 'Student not found' })
  })

  it('should reset student password', async () => {
    ;(mockRequest.json as jest.Mock).mockResolvedValue({
      id: '1',
      password: 'new_password',
    })

    const response = await PUT(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({ success: true })
    expect(bcrypt.hash).toHaveBeenCalledWith('new_password', 10)
    expect(prisma.student.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: {
        password: 'hashed_password',
      },
    })
  })

  it('should verify parent owns the student', async () => {
    // If parent does not match, the query should return null
    ;(prisma.student.findFirst as jest.Mock).mockResolvedValue(null)
    ;(mockRequest.json as jest.Mock).mockResolvedValue({
      id: '1',
      password: 'new_password',
    })

    const response = await PUT(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data).toEqual({ error: 'Student not found' })
    expect(prisma.student.findFirst).toHaveBeenCalledWith({
      where: {
        id: '1',
        parent: {
          email: mockSession.user.email,
        },
      },
    })
  })
}) 
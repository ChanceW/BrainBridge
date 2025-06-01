import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/signup/route'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    parent: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}))

describe('Signup API', () => {
  const mockParent = {
    id: '1',
    name: 'Test Parent',
    email: 'parent@example.com',
    password: 'hashed_password',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockRequest = {
    json: jest.fn().mockImplementation(() => Promise.resolve({})),
  } as unknown as NextRequest

  beforeEach(() => {
    jest.clearAllMocks()
    ;(prisma.parent.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.parent.create as jest.Mock).mockResolvedValue(mockParent)
    ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password')
  })

  it('should create a new parent account', async () => {
    ;(mockRequest.json as jest.Mock).mockResolvedValue({
      name: 'Test Parent',
      email: 'parent@example.com',
      password: 'password123',
      role: 'parent',
    })

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data).toEqual({
      message: 'Account created successfully',
      user: {
        id: mockParent.id,
        name: mockParent.name,
        email: mockParent.email,
        createdAt: mockParent.createdAt,
        updatedAt: mockParent.updatedAt,
      },
    })
    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12)
    expect(prisma.parent.create).toHaveBeenCalledWith({
      data: {
        name: 'Test Parent',
        email: 'parent@example.com',
        password: 'hashed_password',
      },
    })
  })

  it('should return 400 if email already exists', async () => {
    ;(prisma.parent.findUnique as jest.Mock).mockResolvedValue(mockParent)
    ;(mockRequest.json as jest.Mock).mockResolvedValue({
      name: 'Another Parent',
      email: 'parent@example.com', // Same email as mockParent
      password: 'password123',
      role: 'parent',
    })

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toEqual({
      message: 'Email already registered',
    })
  })

  it('should validate name length', async () => {
    ;(mockRequest.json as jest.Mock).mockResolvedValue({
      name: 'A', // Too short
      email: 'parent@example.com',
      password: 'password123',
      role: 'parent',
    })

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toEqual({
      message: 'Name must be at least 2 characters',
    })
  })

  it('should validate email format', async () => {
    ;(mockRequest.json as jest.Mock).mockResolvedValue({
      name: 'Test Parent',
      email: 'invalid-email', // Invalid email format
      password: 'password123',
      role: 'parent',
    })

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toEqual({
      message: 'Invalid email address',
    })
  })

  it('should validate password length', async () => {
    ;(mockRequest.json as jest.Mock).mockResolvedValue({
      name: 'Test Parent',
      email: 'parent@example.com',
      password: '123', // Too short
      role: 'parent',
    })

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toEqual({
      message: 'Password must be at least 8 characters',
    })
  })

  it('should validate role', async () => {
    ;(mockRequest.json as jest.Mock).mockResolvedValue({
      name: 'Test Parent',
      email: 'parent@example.com',
      password: 'password123',
      role: 'invalid-role', // Invalid role
    })

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toEqual({
      message: expect.stringContaining('role'),
    })
  })

  it('should handle server errors', async () => {
    ;(mockRequest.json as jest.Mock).mockResolvedValue({
      name: 'Test Parent',
      email: 'parent@example.com',
      password: 'password123',
      role: 'parent',
    })
    ;(prisma.parent.create as jest.Mock).mockRejectedValue(new Error('Database error'))

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({
      message: 'Failed to create account',
    })
  })
}) 
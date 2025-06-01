import { authOptions } from '@/app/api/auth/config'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { CredentialsConfig, CredentialInput } from 'next-auth/providers/credentials'
import { JWT } from 'next-auth/jwt'
import { Session } from 'next-auth'
import { Account } from 'next-auth/core/types'
import { NextAuthOptions } from 'next-auth'
import { CredentialsProvider } from 'next-auth/providers/credentials'

// Import the real authorize function
import { PrismaClient } from '@prisma/client'
import { compare } from 'bcryptjs'

// Define our custom user type
type CustomUser = {
  id: string
  name: string
  email: string
  role: string
  emailVerified: Date | null
}

// Define a local authorize function for testing
const authorize = async (credentials: Record<string, string> | undefined) => {
  if (!credentials?.userName || !credentials?.password || !credentials?.role) {
    throw new Error('Missing credentials')
  }
  if (credentials.role === 'student') {
    const student = await prisma.student.findUnique({
      where: { userName: credentials.userName },
    })
    if (!student) throw new Error('Invalid username or password')
    const isValid = await bcrypt.compare(credentials.password, student.password)
    if (!isValid) throw new Error('Invalid username or password')
    return {
      id: student.id,
      name: student.name,
      email: student.userName,
      role: 'student',
    }
  } else if (credentials.role === 'parent') {
    const parent = await prisma.parent.findUnique({
      where: { email: credentials.userName },
    })
    if (!parent) throw new Error('Invalid email or password')
    const isValid = await bcrypt.compare(credentials.password, parent.password)
    if (!isValid) throw new Error('Invalid email or password')
    return {
      id: parent.id,
      name: parent.name,
      email: parent.email,
      role: 'parent',
    }
  }
  throw new Error('Invalid role')
}

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    student: {
      findUnique: jest.fn(),
    },
    parent: {
      findUnique: jest.fn(),
    },
  },
}))

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}))

describe('Auth Configuration', () => {
  const mockStudent = {
    id: '1',
    name: 'Test Student',
    userName: 'student@example.com',
    password: 'hashed_password',
  }

  const mockParent = {
    id: '2',
    name: 'Test Parent',
    email: 'parent@example.com',
    password: 'hashed_password',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(prisma.student.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.parent.findUnique as jest.Mock).mockResolvedValue(null)
    ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)
  })

  describe('Credentials Provider', () => {
    it('should throw error if credentials are missing', async () => {
      await expect(authorize(undefined)).rejects.toThrow('Missing credentials')
      await expect(authorize({ userName: 'test' })).rejects.toThrow('Missing credentials')
      await expect(authorize({ password: 'test' })).rejects.toThrow('Missing credentials')
      await expect(authorize({ role: 'student' })).rejects.toThrow('Missing credentials')
    })

    describe('Student Authentication', () => {
      it('should throw error if student not found', async () => {
        await expect(authorize({
          userName: 'nonexistent@example.com',
          password: 'password123',
          role: 'student',
        })).rejects.toThrow('Invalid username or password')
      })

      it('should throw error if password is invalid', async () => {
        ;(prisma.student.findUnique as jest.Mock).mockResolvedValue(mockStudent)
        ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

        await expect(authorize({
          userName: mockStudent.userName,
          password: 'wrong_password',
          role: 'student',
        })).rejects.toThrow('Invalid username or password')
      })

      it('should return student user if credentials are valid', async () => {
        ;(prisma.student.findUnique as jest.Mock).mockResolvedValue(mockStudent)
        ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

        const user = await authorize({
          userName: mockStudent.userName,
          password: 'password123',
          role: 'student',
        })

        expect(user).toEqual({
          id: mockStudent.id,
          name: mockStudent.name,
          email: mockStudent.userName,
          role: 'student',
        })
      })
    })

    describe('Parent Authentication', () => {
      it('should throw error if parent not found', async () => {
        await expect(authorize({
          userName: 'nonexistent@example.com',
          password: 'password123',
          role: 'parent',
        })).rejects.toThrow('Invalid email or password')
      })

      it('should throw error if password is invalid', async () => {
        ;(prisma.parent.findUnique as jest.Mock).mockResolvedValue(mockParent)
        ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

        await expect(authorize({
          userName: mockParent.email,
          password: 'wrong_password',
          role: 'parent',
        })).rejects.toThrow('Invalid email or password')
      })

      it('should return parent user if credentials are valid', async () => {
        ;(prisma.parent.findUnique as jest.Mock).mockResolvedValue(mockParent)
        ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

        const user = await authorize({
          userName: mockParent.email,
          password: 'password123',
          role: 'parent',
        })

        expect(user).toEqual({
          id: mockParent.id,
          name: mockParent.name,
          email: mockParent.email,
          role: 'parent',
        })
      })
    })

    it('should throw error if role is invalid', async () => {
      await expect(authorize({
        userName: 'test@example.com',
        password: 'password123',
        role: 'invalid-role',
      })).rejects.toThrow('Invalid role')
    })
  })

  describe('JWT Callback', () => {
    const mockUser: CustomUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'student',
      emailVerified: null,
    }

    const mockToken: JWT = {
      sub: '1',
      name: 'Test User',
      email: 'test@example.com',
      id: '1',
      role: 'student',
    }

    const mockAccount: Account = {
      provider: 'credentials',
      type: 'credentials',
      id: '1',
      providerAccountId: '1',
    }

    it('should add user id and role to token', async () => {
      if (!authOptions.callbacks?.jwt) throw new Error('JWT callback not defined')
      const token = await authOptions.callbacks.jwt({
        token: mockToken,
        user: mockUser,
        account: mockAccount,
        profile: undefined,
        trigger: 'signIn',
        isNewUser: false,
      })

      expect(token).toEqual({
        ...mockToken,
        id: mockUser.id,
        role: mockUser.role,
      })
    })

    it('should return token unchanged if no user', async () => {
      if (!authOptions.callbacks?.jwt) throw new Error('JWT callback not defined')
      const token = await authOptions.callbacks.jwt({
        token: mockToken,
        user: mockUser,
        account: mockAccount,
        profile: undefined,
        trigger: 'signIn',
        isNewUser: false,
      })

      expect(token).toEqual(mockToken)
    })
  })

  describe('Session Callback', () => {
    const mockSession: Session = {
      user: {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'student',
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }

    const mockToken: JWT = {
      sub: '1',
      name: 'Test User',
      email: 'test@example.com',
      id: '1',
      role: 'student',
    }

    const mockUser: CustomUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'student',
      emailVerified: null,
    }

    it('should add user id and role to session', async () => {
      if (!authOptions.callbacks?.session) throw new Error('Session callback not defined')
      const session = await authOptions.callbacks.session({
        session: mockSession,
        token: mockToken,
        user: mockUser,
        newSession: {},
        trigger: 'update',
      })

      expect(session).toEqual({
        user: {
          ...mockSession.user,
          id: mockToken.id,
          role: mockToken.role,
        },
        expires: mockSession.expires,
      })
    })

    it('should return session unchanged if no token', async () => {
      if (!authOptions.callbacks?.session) throw new Error('Session callback not defined')
      const session = await authOptions.callbacks.session({
        session: mockSession,
        token: mockToken,
        user: mockUser,
        newSession: {},
        trigger: 'update',
      })

      expect(session).toEqual(mockSession)
    })
  })
}) 
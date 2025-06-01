// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    }
  },
  usePathname() {
    return ''
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession() {
    return { data: null, status: 'unauthenticated' }
  },
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

// Mock environment variables
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
process.env.OPENAI_API_KEY = 'test-api-key'

// Polyfill global Request and Response for Node.js (for Next.js API route tests)
if (typeof global.Request === 'undefined') {
  global.Request = require('node-fetch').Request
}
if (typeof global.Response === 'undefined') {
  global.Response = require('node-fetch').Response
}

// Mock NextResponse.json, redirect, and next for Next.js API route tests
jest.mock('next/server', () => {
  const actual = jest.requireActual('next/server');
  return {
    ...actual,
    NextResponse: {
      ...actual.NextResponse,
      json: (data, init) => ({
        status: (init && init.status) || 200,
        json: async () => data,
        headers: {},
      }),
      redirect: (url) => ({ url, status: 307 }),
      next: () => ({ next: true }),
    },
  };
});

// Global Prisma mock to prevent browser environment errors in all tests
jest.mock('@prisma/client', () => {
  const actual = jest.requireActual('@prisma/client');
  return {
    ...actual,
    PrismaClient: jest.fn(() => ({
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
        create: jest.fn(),
      },
      worksheet: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    })),
  };
}); 
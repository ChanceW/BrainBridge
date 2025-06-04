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

// Mock the Request object
global.Request = class Request {
  constructor(url, options = {}) {
    this.url = url
    this.method = options.method || 'GET'
    this.headers = new Headers(options.headers)
    this._body = options.body
  }

  async json() {
    if (this._body) {
      return JSON.parse(this._body)
    }
    return {}
  }
}

// Mock the Response object
global.Response = class Response {
  constructor(body, options = {}) {
    this._body = body
    this.status = options.status || 200
    this.ok = this.status >= 200 && this.status < 300
    this.headers = new Headers(options.headers)
  }

  async json() {
    if (typeof this._body === 'string') {
      return JSON.parse(this._body)
    }
    return this._body
  }
}

// Mock the Headers object
global.Headers = class Headers {
  constructor(init = {}) {
    this._headers = new Map(Object.entries(init))
  }

  get(name) {
    return this._headers.get(name.toLowerCase())
  }

  set(name, value) {
    this._headers.set(name.toLowerCase(), value)
  }

  has(name) {
    return this._headers.has(name.toLowerCase())
  }
}

// Mock fetch
global.fetch = jest.fn()

// Mock URL
global.URL = class URL {
  constructor(url, base) {
    this.href = base ? new URL(url, base).href : url
    this.searchParams = new URLSearchParams()
  }
}

// Mock URLSearchParams
global.URLSearchParams = class URLSearchParams {
  constructor(init = '') {
    this._params = new Map()
    if (typeof init === 'string') {
      init.split('&').forEach(pair => {
        const [key, value] = pair.split('=')
        if (key) this._params.set(key, value || '')
      })
    }
  }

  get(name) {
    return this._params.get(name) || null
  }

  set(name, value) {
    this._params.set(name, value)
  }

  has(name) {
    return this._params.has(name)
  }

  toString() {
    return Array.from(this._params.entries())
      .map(([key, value]) => `${key}=${value}`)
      .join('&')
  }
}

// Mock console.error to reduce noise in tests
const originalConsoleError = console.error
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Warning: React does not recognize the `fetchPriority` prop')) {
    return
  }
  originalConsoleError(...args)
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
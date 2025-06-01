import { NextRequest, NextResponse } from 'next/server'
import { NextRequestWithAuth } from 'next-auth/middleware'
import middleware from '@/middleware'

// Mock next-auth/middleware
jest.mock('next-auth/middleware', () => ({
  withAuth: (fn: Function) => (req: NextRequestWithAuth, event: any) => fn(req, event),
}))

describe('Authentication Middleware', () => {
  const createMockRequest = (path: string, token: any = null): NextRequestWithAuth => {
    const url = new URL(`http://localhost${path}`)
    const baseRequest = {
      nextUrl: url,
      url: url.toString(),
      cookies: new Map(),
      geo: {},
      ip: '',
      headers: new Headers(),
      method: 'GET',
    } as unknown as NextRequest

    return {
      ...baseRequest,
      nextauth: { token },
    } as NextRequestWithAuth
  }

  const mockEvent = {} as any

  describe('Public Paths', () => {
    const publicPaths = [
      '/student/login',
      '/parent/login',
      '/parent/signup',
      '/parent/forgot-password',
      '/error'
    ]

    it.each(publicPaths)('should allow access to public path: %s', (path) => {
      const req = createMockRequest(path)
      const response = middleware(req, mockEvent)
      expect(response).toEqual(NextResponse.next())
    })

    it('should redirect authenticated student from student login to dashboard', () => {
      const req = createMockRequest('/student/login', { role: 'student' })
      const response = middleware(req, mockEvent)
      expect(response).toEqual(NextResponse.redirect(new URL('/student/dashboard', req.url)))
    })

    it('should redirect authenticated parent from parent login to dashboard', () => {
      const req = createMockRequest('/parent/login', { role: 'parent' })
      const response = middleware(req, mockEvent)
      expect(response).toEqual(NextResponse.redirect(new URL('/parent/dashboard', req.url)))
    })
  })

  describe('Protected Student Routes', () => {
    it('should redirect unauthenticated user to student login', () => {
      const req = createMockRequest('/student/dashboard')
      const response = middleware(req, mockEvent)
      const expectedUrl = new URL('/student/login', req.url)
      expectedUrl.searchParams.set('callbackUrl', '/student/dashboard')
      expect(response).toEqual(NextResponse.redirect(expectedUrl))
    })

    it('should allow student access to student routes', () => {
      const req = createMockRequest('/student/dashboard', { role: 'student' })
      const response = middleware(req, mockEvent)
      expect(response).toEqual(NextResponse.next())
    })

    it('should redirect parent from student routes to home', () => {
      const req = createMockRequest('/student/dashboard', { role: 'parent' })
      const response = middleware(req, mockEvent)
      expect(response).toEqual(NextResponse.redirect(new URL('/', req.url)))
    })

    it('should allow parent access to student worksheet review pages', () => {
      const req = createMockRequest('/student/worksheet/123', { role: 'parent' })
      const response = middleware(req, mockEvent)
      expect(response).toEqual(NextResponse.next())
    })
  })

  describe('Protected Parent Routes', () => {
    it('should redirect unauthenticated user to parent login', () => {
      const req = createMockRequest('/parent/dashboard')
      const response = middleware(req, mockEvent)
      const expectedUrl = new URL('/parent/login', req.url)
      expectedUrl.searchParams.set('callbackUrl', '/parent/dashboard')
      expect(response).toEqual(NextResponse.redirect(expectedUrl))
    })

    it('should allow parent access to parent routes', () => {
      const req = createMockRequest('/parent/dashboard', { role: 'parent' })
      const response = middleware(req, mockEvent)
      expect(response).toEqual(NextResponse.next())
    })

    it('should redirect student from parent routes to home', () => {
      const req = createMockRequest('/parent/dashboard', { role: 'student' })
      const response = middleware(req, mockEvent)
      expect(response).toEqual(NextResponse.redirect(new URL('/', req.url)))
    })
  })
}) 
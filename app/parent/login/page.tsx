'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

// Create a client component that uses useSearchParams
function ParentLoginContent() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/parent/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  // Only redirect if authenticated as a parent
  useEffect(() => {
    if (status === 'authenticated' && session.user.role === 'parent') {
      router.push('/parent/dashboard')
    }
  }, [status, session, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        userName: email,
        password,
        role: 'parent',
        redirect: false,
        callbackUrl,
      })

      if (result?.error) {
        if (result.error.includes('Invalid email')) {
          setError('Email not found. Please check your email or sign up.')
        } else if (result.error.includes('Invalid password')) {
          setError('Incorrect password. Please try again.')
        } else {
          setError('Login failed. Please try again.')
        }
      } else {
        if (rememberMe) {
          localStorage.setItem('rememberParentEmail', email)
        } else {
          localStorage.removeItem('rememberParentEmail')
        }
        router.push('/parent/dashboard')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Image
              src="/ThinkDrillsLogo.png"
              alt="ThinkDrills Logo"
              width={200}
              height={200}
              className="mx-auto mb-4"
            />
          </Link>
          <h1 className="text-3xl font-serif font-bold mb-2">
            Parent Login
          </h1>
          <p className="text-gray-600">
            Welcome back! Please enter your credentials to continue.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field w-full"
                required
                autoComplete="email"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field w-full"
                required
                autoComplete="current-password"
                placeholder="Enter your password"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-bg-blue focus:ring-bg-blue border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <Link
                href="/parent/forgot-password"
                className="text-sm text-bg-blue-dark hover:text-bg-blue"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </>
              ) : (
                'Log In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link 
                href="/parent/signup"
                className="text-bg-blue-dark hover:text-bg-blue font-medium"
              >
                Sign up here
              </Link>
            </p>
            <div className="border-t border-gray-200 pt-4">
              <Link 
                href="/student/login"
                className="text-sm text-bg-blue-dark hover:text-bg-blue"
              >
                Student? Log in here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function ParentLogin() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </main>
    }>
      <ParentLoginContent />
    </Suspense>
  )
} 
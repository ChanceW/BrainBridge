'use client'

import { useState } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect } from 'react'
import { Suspense } from 'react'

function StudentLoginContent() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/student/dashboard'
  const error = searchParams.get('error')

  const [userName, setUserName] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Only redirect if authenticated as a student
    if (status === 'authenticated' && session.user.role === 'student') {
      router.push('/student/dashboard')
    }
  }, [status, session, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        userName,
        password,
        role: 'student',
        redirect: false,
        callbackUrl,
      })

      if (result?.error) {
        router.push(`/error?error=${result.error}`)
      } else if (result?.url) {
        router.push(result.url)
      }
    } catch (error) {
      router.push('/error')
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state while checking session
  if (status === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Image
              src="/BrainGym_Logo_Cropped.png"
              alt="BrainGym Logo"
              width={200}
              height={200}
              className="mx-auto mb-4"
            />
          </Link>
          <h1 className="text-3xl font-serif font-bold mb-2">
            Student Login
          </h1>
          <p className="text-gray-600">
            Welcome back! Please enter your credentials to continue.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error === 'CredentialsSignin' && (
              <div className="bg-red-100 text-red-700 p-3 rounded-lg">
                Invalid username or password
              </div>
            )}

            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                id="userName"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="input-field w-full"
                required
                autoComplete="username"
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
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link 
              href="/parent/login"
              className="text-sm text-bg-blue-dark hover:text-bg-blue"
            >
              Parent? Log in here
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function StudentLogin() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StudentLoginContent />
    </Suspense>
  )
} 
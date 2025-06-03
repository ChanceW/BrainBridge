'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

export default function ForgotPassword() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong')
      }

      setSuccess(true)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to process request')
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
              className="mx-auto mb-4 rounded-[15px]"
            />
          </Link>
          <h1 className="text-3xl font-serif font-bold mb-2">
            Forgot Password
          </h1>
          <p className="text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {success ? (
            <div className="text-center">
              <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4">
                Password reset link has been sent to your email.
              </div>
              <p className="text-gray-600 mb-4">
                Please check your email for instructions to reset your password.
              </p>
              <Link
                href="/parent/login"
                className="text-bg-blue-dark hover:text-bg-blue"
              >
                Return to login
              </Link>
            </div>
          ) : (
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

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full"
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <div className="text-center">
                <Link
                  href="/parent/login"
                  className="text-sm text-bg-blue-dark hover:text-bg-blue"
                >
                  Back to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  )
} 
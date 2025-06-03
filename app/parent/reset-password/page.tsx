'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

export default function ResetPassword() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null)

  useEffect(() => {
    // Validate token on page load
    if (!token) {
      setIsValidToken(false)
      return
    }

    const validateToken = async () => {
      try {
        const response = await fetch(`/api/auth/validate-reset-token?token=${token}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Invalid or expired token')
        }

        setIsValidToken(true)
      } catch (error) {
        setIsValidToken(false)
        setError(error instanceof Error ? error.message : 'Invalid or expired token')
      }
    }

    validateToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess(false)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password')
      }

      setSuccess(true)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to reset password')
    } finally {
      setIsLoading(false)
    }
  }

  if (isValidToken === null) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
        <div className="text-center">Validating token...</div>
      </main>
    )
  }

  if (!isValidToken) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
        <div className="max-w-md w-full text-center">
          <Link href="/" className="inline-block mb-8">
            <Image
              src="/ThinkDrillsLogo.png"
              alt="ThinkDrills Logo"
              width={200}
              height={200}
              className="mx-auto rounded-[15px]"
            />
          </Link>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-serif font-bold mb-4 text-red-600">
              Invalid or Expired Link
            </h1>
            <p className="text-gray-600 mb-6">
              {error || 'This password reset link is invalid or has expired. Please request a new password reset link.'}
            </p>
            <Link
              href="/parent/forgot-password"
              className="btn-primary block w-full text-center"
            >
              Request New Reset Link
            </Link>
          </div>
        </div>
      </main>
    )
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
            Reset Password
          </h1>
          <p className="text-gray-600">
            Enter your new password below.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {success ? (
            <div className="text-center">
              <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4">
                Password has been reset successfully.
              </div>
              <p className="text-gray-600 mb-4">
                You can now log in with your new password.
              </p>
              <Link
                href="/parent/login"
                className="btn-primary block w-full text-center"
              >
                Go to Login
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
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field w-full"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field w-full"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Confirm new password"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full"
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
} 
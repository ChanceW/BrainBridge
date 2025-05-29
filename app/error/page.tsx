'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Suspense } from 'react'

function ErrorPageContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  let errorMessage = 'An error occurred'
  if (error === 'CredentialsSignin') {
    errorMessage = 'Invalid username or password'
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
      <div className="max-w-md w-full text-center">
        <Link href="/" className="inline-block mb-8">
          <Image
            src="/BB_Logo.svg"
            alt="BrainBridge Logo"
            width={80}
            height={80}
            className="mx-auto"
          />
        </Link>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-serif font-bold mb-4 text-red-600">
            Authentication Error
          </h1>
          <p className="text-gray-600 mb-6">
            {errorMessage}
          </p>
          <div className="space-y-4">
            <Link
              href="/student/login"
              className="btn-primary block w-full text-center"
            >
              Student Login
            </Link>
            <Link
              href="/parent/login"
              className="btn-secondary block w-full text-center"
            >
              Parent Login
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function ErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorPageContent />
    </Suspense>
  )
} 
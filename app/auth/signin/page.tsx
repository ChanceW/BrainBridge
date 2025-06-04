'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'

function SignInContent() {
  const router = useRouter()
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const role = searchParams.get('role')

  useEffect(() => {
    if (session?.user?.role) {
      // If user is already authenticated, redirect to their dashboard
      const dashboardPath = session.user.role === 'student' ? '/student/dashboard' : '/parent/dashboard'
      router.push(dashboardPath)
    } else if (role === 'student') {
      // If role is specified as student, redirect to student login
      router.push(`/student/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
    } else {
      // Default to parent login
      router.push(`/parent/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
    }
  }, [session, role, callbackUrl, router])

  // Show loading state while redirecting
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">Redirecting to login...</div>
    </main>
  )
}

export default function SignIn() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </main>
    }>
      <SignInContent />
    </Suspense>
  )
} 
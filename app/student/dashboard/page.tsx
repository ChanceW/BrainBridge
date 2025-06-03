'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Navigation from '@/app/components/Navigation'

interface Question {
  id: string
  content: string
  options: string[]
  answer: string
  explanation: string
  studentAnswer?: string
  isCorrect?: boolean
}

interface Worksheet {
  id: string
  title: string
  description: string
  subject: string
  grade: number
  questions: Question[]
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
  score?: number
  startedAt?: string
  completedAt?: string
}

// Create a client component that uses useSearchParams
function StudentDashboardContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentWorksheet, setCurrentWorksheet] = useState<Worksheet | null>(null)
  const [previousWorksheets, setPreviousWorksheets] = useState<Worksheet[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [redoingWorksheet, setRedoingWorksheet] = useState<string | null>(null)
  const [isGeneratingWorksheet, setIsGeneratingWorksheet] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/student/login')
    } else if (status === 'authenticated') {
      fetchWorksheets()
    }
  }, [status, router])

  useEffect(() => {
    // Show success message and refresh worksheets if worksheet was just submitted
    if (searchParams.get('submitted') === 'true') {
      console.log('Worksheet submitted, refreshing...')
      setShowSuccess(true)
      fetchWorksheets() // Refresh the worksheet list
      // Hide success message after 5 seconds
      const timer = setTimeout(() => setShowSuccess(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [searchParams])

  const fetchWorksheets = async () => {
    try {
      console.log('Fetching worksheets...')
      const response = await fetch('/api/worksheets')
      const data = await response.json()
      
      if (response.ok) {
        console.log('Worksheets fetched:', {
          current: data.currentWorksheet,
          previous: data.previousWorksheets
        })
        setCurrentWorksheet(data.currentWorksheet)
        setPreviousWorksheets(data.previousWorksheets)
      } else {
        console.error('Failed to fetch worksheets:', data.error)
        setError(data.error || 'Failed to fetch worksheets')
      }
    } catch (error) {
      console.error('Error fetching worksheets:', error)
      setError('Failed to fetch worksheets')
    } finally {
      setLoading(false)
    }
  }

  const generateNewWorksheet = async (force: boolean = false) => {
    setGenerating(true)
    try {
      const response = await fetch('/api/worksheets/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ force }),
      })

      if (response.ok) {
        await fetchWorksheets() // Refresh the worksheet list
        setShowSuccess(false) // Reset success message from any previous submissions
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to generate worksheet')
      }
    } catch (error) {
      setError('Failed to generate worksheet')
    } finally {
      setGenerating(false)
    }
  }

  const startWorksheet = async (worksheetId: string) => {
    router.push(`/student/worksheet/${worksheetId}`)
  }

  const redoWorksheet = async (worksheetId: string) => {
    setRedoingWorksheet(worksheetId)
    try {
      const response = await fetch('/api/worksheets', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          worksheetId,
          status: 'NOT_STARTED',
          answers: [],
          reset: true
        }),
      })

      if (response.ok) {
        await fetchWorksheets() // Refresh the worksheet list
        router.push(`/student/worksheet/${worksheetId}`)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to reset worksheet')
      }
    } catch (error) {
      setError('Failed to reset worksheet')
    } finally {
      setRedoingWorksheet(null)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen p-8">
          <div className="text-center">Loading...</div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold mb-6 sm:mb-8">
            Student Dashboard
          </h1>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm sm:text-base">
              {error}
            </div>
          )}

          {showSuccess && (
            <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4 flex items-center justify-between text-sm sm:text-base">
              <div className="flex items-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Worksheet submitted successfully! Your answers have been recorded.</span>
              </div>
              <button 
                onClick={() => setShowSuccess(false)}
                className="text-green-700 hover:text-green-900 ml-2"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Today's Worksheet */}
          <section className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Today's Worksheet</h2>
            {currentWorksheet ? (
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 sm:gap-6">
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-bold mb-2">{currentWorksheet.title}</h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-2">{currentWorksheet.description}</p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      Subject: {currentWorksheet.subject} | Grade: {currentWorksheet.grade}
                    </p>
                    {currentWorksheet.status === 'COMPLETED' && (
                      <p className="text-sm sm:text-base font-semibold mt-2 text-green-600">
                        Score: {currentWorksheet.score}%
                      </p>
                    )}
                  </div>
                  <div className="w-full sm:w-auto">
                    {currentWorksheet.status === 'COMPLETED' ? (
                      <button
                        onClick={() => generateNewWorksheet(true)}
                        disabled={generating}
                        className="btn-primary w-full sm:w-auto"
                      >
                        {generating ? 'Generating...' : 'Generate New Worksheet'}
                      </button>
                    ) : (
                      <button
                        onClick={() => startWorksheet(currentWorksheet.id)}
                        className="btn-primary w-full sm:w-auto"
                      >
                        {currentWorksheet.status === 'NOT_STARTED' ? 'Start' : 'Continue'}
                      </button>
                    )}
                  </div>
                </div>
                {currentWorksheet.status === 'IN_PROGRESS' && (
                  <div className="text-xs sm:text-sm text-gray-500 mt-3">
                    Started: {new Date(currentWorksheet.startedAt!).toLocaleString()}
                  </div>
                )}
                {currentWorksheet.status === 'COMPLETED' && (
                  <div className="text-xs sm:text-sm text-gray-500 mt-3">
                    Completed: {new Date(currentWorksheet.completedAt!).toLocaleString()}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 sm:p-6 text-center">
                <p className="text-sm sm:text-base text-gray-600 mb-4">No worksheet available for today.</p>
                <button
                  onClick={() => generateNewWorksheet(false)}
                  disabled={generating}
                  className="btn-primary w-full sm:w-auto"
                >
                  {generating ? 'Generating...' : 'Generate New Worksheet'}
                </button>
              </div>
            )}
          </section>

          {/* Previous Worksheets */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Previous Worksheets</h2>
            {previousWorksheets.length > 0 ? (
              <div className="grid gap-4">
                {previousWorksheets.map((worksheet) => (
                  <div key={worksheet.id} className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 sm:gap-6">
                      <div className="flex-1">
                        <h3 className="text-lg sm:text-xl font-bold mb-2">{worksheet.title}</h3>
                        <p className="text-sm sm:text-base text-gray-600 mb-2">{worksheet.description}</p>
                        <p className="text-xs sm:text-sm text-gray-500">
                          Subject: {worksheet.subject} | Grade: {worksheet.grade}
                        </p>
                        {worksheet.status === 'COMPLETED' && (
                          <p className="text-sm sm:text-base font-semibold mt-2">
                            Score: {worksheet.score}%
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => startWorksheet(worksheet.id)}
                          className="btn-secondary w-full sm:w-auto"
                        >
                          Review
                        </button>
                        {worksheet.status === 'COMPLETED' && (
                          <button
                            onClick={() => redoWorksheet(worksheet.id)}
                            className="btn-primary w-full sm:w-auto"
                            disabled={redoingWorksheet === worksheet.id}
                          >
                            {redoingWorksheet === worksheet.id ? 'Resetting...' : 'Redo'}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500 mt-3">
                      Completed: {new Date(worksheet.completedAt!).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 sm:p-6 text-center">
                <p className="text-sm sm:text-base text-gray-600">No previous worksheets available.</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  )
}

export default function StudentDashboard() {
  return (
    <Suspense fallback={
      <>
        <Navigation />
        <main className="min-h-screen p-8">
          <div className="text-center">Loading...</div>
        </main>
      </>
    }>
      <StudentDashboardContent />
    </Suspense>
  )
} 
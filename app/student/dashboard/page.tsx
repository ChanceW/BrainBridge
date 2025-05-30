'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
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

export default function StudentDashboard() {
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
    // Show success message if worksheet was just submitted
    if (searchParams.get('submitted') === 'true') {
      setShowSuccess(true)
      // Hide success message after 5 seconds
      const timer = setTimeout(() => setShowSuccess(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [searchParams])

  const fetchWorksheets = async () => {
    try {
      const response = await fetch('/api/worksheets')
      const data = await response.json()
      
      if (response.ok) {
        setCurrentWorksheet(data.currentWorksheet)
        setPreviousWorksheets(data.previousWorksheets)

        // Only generate a new worksheet if:
        // 1. No current worksheet exists
        // 2. We're not already in the process of generating one
        // 3. This is not a recursive call from generateNewWorksheet
        if (!data.currentWorksheet && !isGeneratingWorksheet && !generating) {
          setIsGeneratingWorksheet(true)
          try {
            await generateNewWorksheet(false)
          } finally {
            setIsGeneratingWorksheet(false)
          }
        }
      } else {
        setError(data.error || 'Failed to fetch worksheets')
      }
    } catch (error) {
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
      <main className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-serif font-bold mb-8">
            Student Dashboard
          </h1>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {showSuccess && (
            <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Worksheet submitted successfully! Your answers have been recorded.</span>
              </div>
              <button 
                onClick={() => setShowSuccess(false)}
                className="text-green-700 hover:text-green-900"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Today's Worksheet */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Today's Worksheet</h2>
            {currentWorksheet ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">{currentWorksheet.title}</h3>
                    <p className="text-gray-600 mb-2">{currentWorksheet.description}</p>
                    <p className="text-sm text-gray-500">
                      Subject: {currentWorksheet.subject} | Grade: {currentWorksheet.grade}
                    </p>
                    {currentWorksheet.status === 'COMPLETED' && (
                      <p className="text-sm font-semibold mt-2 text-green-600">
                        Score: {currentWorksheet.score}%
                      </p>
                    )}
                  </div>
                  {currentWorksheet.status === 'COMPLETED' ? (
                    <button
                      onClick={() => generateNewWorksheet(true)}
                      disabled={generating}
                      className="btn-primary"
                    >
                      {generating ? 'Generating...' : 'Generate New Worksheet'}
                    </button>
                  ) : (
                    <button
                      onClick={() => startWorksheet(currentWorksheet.id)}
                      className="btn-primary"
                    >
                      {currentWorksheet.status === 'NOT_STARTED' ? 'Start' : 'Continue'}
                    </button>
                  )}
                </div>
                {currentWorksheet.status === 'IN_PROGRESS' && (
                  <div className="text-sm text-gray-500">
                    Started: {new Date(currentWorksheet.startedAt!).toLocaleString()}
                  </div>
                )}
                {currentWorksheet.status === 'COMPLETED' && (
                  <div className="text-sm text-gray-500">
                    Completed: {new Date(currentWorksheet.completedAt!).toLocaleString()}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-gray-600 mb-4">No worksheet available for today.</p>
                <button
                  onClick={() => generateNewWorksheet(false)}
                  disabled={generating}
                  className="btn-primary"
                >
                  {generating ? 'Generating...' : 'Generate New Worksheet'}
                </button>
              </div>
            )}
          </section>

          {/* Previous Worksheets */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Previous Worksheets</h2>
            {previousWorksheets.length > 0 ? (
              <div className="grid gap-4">
                {previousWorksheets.map((worksheet) => (
                  <div key={worksheet.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold mb-2">{worksheet.title}</h3>
                        <p className="text-gray-600 mb-2">{worksheet.description}</p>
                        <p className="text-sm text-gray-500">
                          Subject: {worksheet.subject} | Grade: {worksheet.grade}
                        </p>
                        {worksheet.status === 'COMPLETED' && (
                          <p className="text-sm font-semibold mt-2">
                            Score: {worksheet.score}%
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startWorksheet(worksheet.id)}
                          className="btn-secondary"
                        >
                          Review
                        </button>
                        {worksheet.status === 'COMPLETED' && (
                          <button
                            onClick={() => redoWorksheet(worksheet.id)}
                            className="btn-primary"
                            disabled={redoingWorksheet === worksheet.id}
                          >
                            {redoingWorksheet === worksheet.id ? 'Resetting...' : 'Redo'}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      Completed: {new Date(worksheet.completedAt!).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-gray-600">No previous worksheets available.</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  )
} 
'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  const [currentWorksheet, setCurrentWorksheet] = useState<Worksheet | null>(null)
  const [previousWorksheets, setPreviousWorksheets] = useState<Worksheet[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/student/login')
    } else if (status === 'authenticated') {
      fetchWorksheets()
    }
  }, [status, router])

  const fetchWorksheets = async () => {
    try {
      const response = await fetch('/api/worksheets')
      const data = await response.json()
      
      if (response.ok) {
        setCurrentWorksheet(data.currentWorksheet)
        setPreviousWorksheets(data.previousWorksheets)
      } else {
        setError(data.error || 'Failed to fetch worksheets')
      }
    } catch (error) {
      setError('Failed to fetch worksheets')
    } finally {
      setLoading(false)
    }
  }

  const generateNewWorksheet = async () => {
    try {
      setGenerating(true)
      const response = await fetch('/api/worksheets/generate', {
        method: 'POST',
      })

      if (response.ok) {
        const newWorksheet = await response.json()
        setCurrentWorksheet(newWorksheet)
        router.push(`/student/worksheet/${newWorksheet.id}`)
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
    try {
      const response = await fetch('/api/worksheets', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          worksheetId,
          status: 'IN_PROGRESS',
        }),
      })

      if (response.ok) {
        router.push(`/student/worksheet/${worksheetId}`)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to start worksheet')
      }
    } catch (error) {
      setError('Failed to start worksheet')
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
                      onClick={generateNewWorksheet}
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
                  onClick={generateNewWorksheet}
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
                      <button
                        onClick={() => startWorksheet(worksheet.id)}
                        className="btn-secondary"
                      >
                        Review
                      </button>
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
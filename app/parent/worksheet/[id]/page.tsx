'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/app/components/Navigation'
import WorksheetAnalytics from '@/app/components/WorksheetAnalytics'

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

export default function ParentWorksheetPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [worksheet, setWorksheet] = useState<Worksheet | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/parent/login')
    } else if (status === 'authenticated') {
      if (session.user.role === 'parent') {
        fetchWorksheet()
      } else {
        router.push('/')
      }
    }
  }, [status, router, params.id, session?.user?.role])

  const fetchWorksheet = async () => {
    try {
      const response = await fetch(`/api/worksheets/${params.id}`)
      const data = await response.json()
      
      if (response.ok) {
        setWorksheet(data)
      } else {
        setError(data.error || 'Failed to fetch worksheet')
      }
    } catch (error) {
      setError('Failed to fetch worksheet')
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    if (currentQuestionIndex < (worksheet?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
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

  if (!worksheet) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen p-8">
          <div className="text-center text-red-600">Worksheet not found</div>
        </main>
      </>
    )
  }

  const currentQuestion = worksheet.questions[currentQuestionIndex]

  return (
    <>
      <Navigation />
      <main className="min-h-screen p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold">
              {worksheet.title} - Review
            </h1>
            <button
              onClick={() => router.push('/parent/dashboard?tab=reports')}
              className="btn-secondary w-full sm:w-auto text-sm sm:text-base"
            >
              Return to Reports
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
            {/* Analytics Report */}
            {worksheet.status === 'COMPLETED' && (
              <WorksheetAnalytics 
                questions={worksheet.questions}
                score={worksheet.score || 0}
                completedAt={worksheet.completedAt || ''}
                timeSpent={worksheet.startedAt && worksheet.completedAt ? 
                  (new Date(worksheet.completedAt).getTime() - new Date(worksheet.startedAt).getTime()) / 1000 
                  : undefined}
              />
            )}

            {/* Question Review */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold">Question Review</h2>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                  <span>Question {currentQuestionIndex + 1} of {worksheet.questions.length}</span>
                </div>
              </div>

              {/* Question Navigation */}
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-1 sm:gap-2 mb-4 sm:mb-6">
                {worksheet.questions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`
                      relative w-full aspect-square rounded-lg text-xs sm:text-sm font-medium
                      flex items-center justify-center transition-colors
                      ${currentQuestionIndex === index 
                        ? 'border-b-2 border-bg-blue-dark text-bg-blue-dark bg-white' 
                        : question.isCorrect
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }
                    `}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              {/* Current Question */}
              <div>
                <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">{currentQuestion.content}</h3>
                <div className="space-y-2 sm:space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <div
                      key={index}
                      className={`w-full p-3 sm:p-4 rounded-lg border text-sm sm:text-base ${
                        option === currentQuestion.studentAnswer
                          ? currentQuestion.isCorrect
                            ? 'bg-green-100 border-green-500'
                            : 'bg-red-100 border-red-500'
                          : option === currentQuestion.answer
                            ? 'bg-green-100 border-green-500'
                            : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      {option}
                    </div>
                  ))}
                </div>

                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-bg-blue bg-opacity-10 rounded-lg">
                  <h4 className="font-semibold text-sm sm:text-base mb-2">Explanation:</h4>
                  <p className="text-sm sm:text-base">{currentQuestion.explanation}</p>
                  {currentQuestion.studentAnswer && (
                    <p className="mt-2 text-sm sm:text-base text-gray-600">
                      Student's answer: {currentQuestion.studentAnswer}
                      {currentQuestion.isCorrect 
                        ? ' ✓' 
                        : ` ✗ (Correct answer: ${currentQuestion.answer})`}
                    </p>
                  )}
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-6">
                <button
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                  className="btn-secondary px-6"
                >
                  Previous
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentQuestionIndex === worksheet.questions.length - 1}
                  className="btn-primary px-6"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
} 
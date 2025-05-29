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

export default function WorksheetPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [worksheet, setWorksheet] = useState<Worksheet | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/student/login')
    } else if (status === 'authenticated') {
      fetchWorksheet()
    }
  }, [status, router, params.id])

  const fetchWorksheet = async () => {
    try {
      const response = await fetch('/api/worksheets')
      const data = await response.json()
      
      if (response.ok) {
        const foundWorksheet = [...(data.previousWorksheets || []), data.currentWorksheet]
          .find(w => w?.id === params.id)
        
        if (foundWorksheet) {
          setWorksheet(foundWorksheet)
          // Initialize answers with saved student answers or empty strings
          setAnswers(foundWorksheet.questions.map((q: Question) => q.studentAnswer || ''))
        } else {
          setError('Worksheet not found')
        }
      } else {
        setError(data.error || 'Failed to fetch worksheet')
      }
    } catch (error) {
      setError('Failed to fetch worksheet')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestionIndex] = answer
    setAnswers(newAnswers)
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

  const handleSaveProgress = async () => {
    if (!worksheet) return

    setIsSaving(true)
    try {
      const response = await fetch('/api/worksheets', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          worksheetId: worksheet.id,
          status: 'IN_PROGRESS',
          answers,
        }),
      })

      if (response.ok) {
        return true
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to save progress')
        return false
      }
    } catch (error) {
      setError('Failed to save progress')
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const handleExit = async () => {
    const saved = await handleSaveProgress()
    if (saved) {
      router.push('/student/dashboard')
    }
  }

  const handleSubmit = async () => {
    if (!worksheet) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/worksheets', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          worksheetId: worksheet.id,
          status: 'COMPLETED',
          answers,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setWorksheet({ ...worksheet, ...data })
        setShowSubmitConfirm(false)
        router.push('/student/dashboard?submitted=true')
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to submit worksheet')
      }
    } catch (error) {
      setError('Failed to submit worksheet')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = async () => {
    if (!worksheet) return

    try {
      const response = await fetch('/api/worksheets', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          worksheetId: worksheet.id,
          status: 'NOT_STARTED',
          answers: new Array(worksheet.questions.length).fill(''),
        }),
      })

      if (response.ok) {
        // Refetch the worksheet to get the reset state
        await fetchWorksheet()
        setCurrentQuestionIndex(0)
        setShowResetConfirm(false)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to reset worksheet')
      }
    } catch (error) {
      setError('Failed to reset worksheet')
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
  const isLastQuestion = currentQuestionIndex === worksheet.questions.length - 1
  const isReview = worksheet.status === 'COMPLETED'
  const hasAnsweredAll = answers.every(answer => answer !== '')

  return (
    <>
      <Navigation />
      <main className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header with Exit and Reset buttons */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-serif font-bold">
              {worksheet.title}
            </h1>
            <div className="flex gap-4">
              {!isReview && (
                <button
                  onClick={() => setShowExitConfirm(true)}
                  className="btn-secondary"
                >
                  Save & Exit
                </button>
              )}
              {isReview && (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="btn-secondary"
                >
                  Reset Worksheet
                </button>
              )}
            </div>
          </div>

          <p className="text-gray-600 mb-8">{worksheet.description}</p>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div>
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Question {currentQuestionIndex + 1} of {worksheet.questions.length}</span>
                <span>{Math.round(((currentQuestionIndex + 1) / worksheet.questions.length) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-bb-blue rounded-full h-2 transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / worksheet.questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question */}
            <div>
              <h2 className="text-xl font-bold mb-4">{currentQuestion.content}</h2>
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => !isReview && handleAnswer(option)}
                    className={`w-full p-4 text-left rounded-lg border transition-colors ${
                      answers[currentQuestionIndex] === option
                        ? isReview
                          ? currentQuestion.isCorrect
                            ? 'bg-green-100 border-green-500'
                            : 'bg-red-100 border-red-500'
                          : 'bg-bb-blue bg-opacity-20 border-bb-blue'
                        : isReview && option === currentQuestion.answer
                        ? 'bg-green-100 border-green-500'
                        : 'border-gray-200 hover:border-bb-blue'
                    }`}
                    disabled={isReview}
                  >
                    {option}
                  </button>
                ))}
              </div>

              {/* Show explanation in review mode */}
              {isReview && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Explanation:</h3>
                  <p>{currentQuestion.explanation}</p>
                  {currentQuestion.studentAnswer && (
                    <p className="mt-2 text-gray-600">
                      Your answer: {currentQuestion.studentAnswer}
                      {currentQuestion.isCorrect 
                        ? ' ✓' 
                        : ` ✗ (Correct answer: ${currentQuestion.answer})`}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="btn-secondary px-6"
              >
                Previous
              </button>

              {isLastQuestion ? (
                !isReview && (
                  <button
                    onClick={() => setShowSubmitConfirm(true)}
                    className="btn-primary px-6"
                    disabled={isSubmitting || !hasAnsweredAll}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </button>
                )
              ) : (
                <button
                  onClick={handleNext}
                  className="btn-primary px-6"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Exit Confirmation Modal */}
        {showExitConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Save Progress & Exit?</h3>
              <p className="text-gray-600 mb-6">
                Your progress will be saved and you can continue later.
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExit}
                  className="btn-primary"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save & Exit'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Submit Confirmation Modal */}
        {showSubmitConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Submit Worksheet?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to submit your worksheet? This action cannot be undone.
                {!hasAnsweredAll && (
                  <span className="block text-red-600 mt-2">
                    Please answer all questions before submitting.
                  </span>
                )}
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowSubmitConfirm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="btn-primary"
                  disabled={isSubmitting || !hasAnsweredAll}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Worksheet'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reset Confirmation Modal */}
        {showResetConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Reset Worksheet?</h3>
              <p className="text-gray-600 mb-6">
                This will clear all your answers and allow you to start over. This action cannot be undone.
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  className="btn-primary"
                >
                  Reset Worksheet
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  )
} 
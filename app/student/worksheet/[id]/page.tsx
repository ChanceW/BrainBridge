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
  const [hasStarted, setHasStarted] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/student/login')
    } else if (status === 'authenticated') {
      if (session.user.role === 'student' || session.user.role === 'parent') {
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
        // Initialize answers with saved student answers or empty strings
        setAnswers(data.questions.map((q: Question) => q.studentAnswer || ''))
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
      console.log('Submitting worksheet:', {
        worksheetId: worksheet.id,
        status: 'COMPLETED',
        answers,
        hasAnsweredAll: answers.every(answer => answer !== '')
      })

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
        console.log('Worksheet submission response:', data)
        setWorksheet({ ...worksheet, ...data })
        setShowSubmitConfirm(false)
        router.push('/student/dashboard?submitted=true')
      } else {
        const data = await response.json()
        console.error('Failed to submit worksheet:', data)
        setError(data.error || 'Failed to submit worksheet')
      }
    } catch (error) {
      console.error('Error submitting worksheet:', error)
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

  const handleStart = async () => {
    try {
      const response = await fetch('/api/worksheets', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          worksheetId: worksheet?.id,
          status: 'IN_PROGRESS',
          answers: [],
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setWorksheet(data)
        setHasStarted(true)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to start worksheet')
      }
    } catch (error) {
      setError('Failed to start worksheet')
    }
  }

  const canEdit = () => {
    return session?.user?.role === 'student' && worksheet?.status !== 'COMPLETED'
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

  if (!hasStarted && worksheet.status === 'NOT_STARTED') {
    return (
      <>
        <Navigation />
        <main className="min-h-screen p-8">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
            <h1 className="text-3xl font-serif font-bold mb-4 text-center">
              {worksheet.title}
            </h1>
            <p className="text-gray-600 mb-8 text-center">{worksheet.description}</p>
            {error && (
              <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-6">
                {error}
              </div>
            )}
            <div className="text-center">
              <button
                onClick={handleStart}
                className="btn-primary px-8 py-3"
              >
                Start Worksheet
              </button>
            </div>
          </div>
        </main>
      </>
    )
  }

  const currentQuestion = worksheet.questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === worksheet.questions.length - 1
  const isReview = worksheet.status === 'COMPLETED'
  const hasAnsweredAll = answers.every(answer => answer !== '')

  if (isReview) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-serif font-bold">
                {worksheet.title} - Review
              </h1>
              <div className="flex gap-4">
                <button
                  onClick={() => router.push('/student/dashboard')}
                  className="btn-secondary"
                >
                  Return to Dashboard
                </button>
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="btn-secondary"
                >
                  Reset Worksheet
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              {/* Analytics Report */}
              <WorksheetAnalytics 
                questions={worksheet.questions}
                score={worksheet.score || 0}
                completedAt={worksheet.completedAt || ''}
                timeSpent={worksheet.startedAt && worksheet.completedAt ? 
                  (new Date(worksheet.completedAt).getTime() - new Date(worksheet.startedAt).getTime()) / 1000 
                  : undefined}
              />

              {/* Question Review */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Question Review</h2>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Question {currentQuestionIndex + 1} of {worksheet.questions.length}</span>
                  </div>
                </div>

                {/* Question Navigation */}
                <div className="grid grid-cols-8 gap-2 mb-6">
                  {worksheet.questions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={`
                        relative w-full aspect-square rounded-lg text-sm font-medium
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
                  <h3 className="text-lg font-medium mb-4">{currentQuestion.content}</h3>
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                      <div
                        key={index}
                        className={`w-full p-4 rounded-lg border ${
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

                  <div className="mt-6 p-4 bg-bg-blue bg-opacity-10 rounded-lg">
                    <h4 className="font-semibold mb-2">Explanation:</h4>
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

  return (
    <>
      <Navigation />
      <main className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {worksheet && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-2xl font-bold mb-2">{worksheet.title}</h1>
                  <p className="text-gray-600 mb-1">{worksheet.description}</p>
                  <p className="text-sm text-gray-500">
                    Subject: {worksheet.subject} | Grade: {worksheet.grade}
                  </p>
                  {worksheet.status === 'COMPLETED' && worksheet.score !== undefined && (
                    <p className="text-sm font-semibold mt-2 text-green-600">
                      Score: {worksheet.score}%
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {worksheet.status === 'NOT_STARTED' && (
                    <button
                      onClick={handleStart}
                      className="btn-primary"
                    >
                      Start Worksheet
                    </button>
                  )}
                  {worksheet.status === 'IN_PROGRESS' && (
                    <>
                      <button
                        onClick={() => setShowExitConfirm(true)}
                        className="btn-secondary"
                      >
                        Save & Exit
                      </button>
                      <button
                        onClick={() => setShowSubmitConfirm(true)}
                        className="btn-primary"
                        disabled={answers.some(answer => answer === '')}
                      >
                        Submit
                      </button>
                    </>
                  )}
                  {worksheet.status === 'COMPLETED' && (
                    <button
                      onClick={() => setShowResetConfirm(true)}
                      className="btn-secondary"
                    >
                      Redo Worksheet
                    </button>
                  )}
                </div>
              </div>

              {worksheet.status !== 'NOT_STARTED' && (
                <div className="space-y-6">
                  {/* Question Navigation */}
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>Question {currentQuestionIndex + 1} of {worksheet.questions.length}</span>
                    </div>
                    <div className="flex gap-2">
                      {worksheet.questions.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentQuestionIndex(index)}
                          className={`w-8 h-8 rounded-full text-sm font-medium flex items-center justify-center transition-colors ${
                            currentQuestionIndex === index
                              ? 'bg-blue-500 text-white'
                              : answers[index]
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {index + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Current Question */}
                  <div className="p-6 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-medium">Question {currentQuestionIndex + 1}</h3>
                      {worksheet.status === 'COMPLETED' && (
                        <span className={`text-sm font-medium ${
                          worksheet.questions[currentQuestionIndex].isCorrect ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {worksheet.questions[currentQuestionIndex].isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      )}
                    </div>
                    <p className="mb-6">{worksheet.questions[currentQuestionIndex].content}</p>
                    
                    <div className="space-y-3">
                      {worksheet.questions[currentQuestionIndex].options.map((option) => (
                        <label
                          key={option}
                          className={`block p-4 rounded-lg border cursor-pointer transition-colors ${
                            worksheet.status === 'COMPLETED'
                              ? option === worksheet.questions[currentQuestionIndex].answer
                                ? 'bg-green-100 border-green-500'
                                : option === worksheet.questions[currentQuestionIndex].studentAnswer && !worksheet.questions[currentQuestionIndex].isCorrect
                                ? 'bg-red-100 border-red-500'
                                : 'bg-gray-50 border-gray-200'
                              : answers[currentQuestionIndex] === option
                              ? 'bg-blue-100 border-blue-500'
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${worksheet.questions[currentQuestionIndex].id}`}
                            value={option}
                            checked={answers[currentQuestionIndex] === option}
                            onChange={() => canEdit() && handleAnswer(option)}
                            disabled={!canEdit()}
                            className="mr-3"
                          />
                          {option}
                        </label>
                      ))}
                    </div>

                    {worksheet.status === 'COMPLETED' && (
                      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <p className="font-medium text-gray-700">Explanation:</p>
                        <p className="text-gray-600">{worksheet.questions[currentQuestionIndex].explanation}</p>
                      </div>
                    )}
                  </div>

                  {/* Navigation Buttons */}
                  {worksheet.status === 'IN_PROGRESS' && canEdit() && (
                    <div className="flex justify-between mt-6">
                      <button
                        onClick={handlePrevious}
                        disabled={currentQuestionIndex === 0}
                        className="btn-secondary"
                      >
                        Previous
                      </button>
                      <button
                        onClick={handleNext}
                        disabled={currentQuestionIndex === worksheet.questions.length - 1}
                        className="btn-secondary"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Confirmation Dialogs */}
          {showExitConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h3 className="text-lg font-bold mb-4">Save and Exit?</h3>
                <p className="text-gray-600 mb-6">
                  Your progress will be saved. You can continue later.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowExitConfirm(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExit}
                    disabled={isSaving}
                    className="btn-primary"
                  >
                    {isSaving ? 'Saving...' : 'Save & Exit'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {showSubmitConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h3 className="text-lg font-bold mb-4">Submit Worksheet?</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to submit your answers? You won't be able to change them after submission.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowSubmitConfirm(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="btn-primary"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {showResetConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h3 className="text-lg font-bold mb-4">Reset Worksheet?</h3>
                <p className="text-gray-600 mb-6">
                  This will clear all your answers and allow you to start over. Are you sure?
                </p>
                <div className="flex justify-end gap-2">
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
                    Reset
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
} 
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
          setAnswers(new Array(foundWorksheet.questions.length).fill(''))
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

  return (
    <>
      <Navigation />
      <main className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-serif font-bold mb-2">
              {worksheet.title}
            </h1>
            <p className="text-gray-600">{worksheet.description}</p>
          </div>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-6">
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
            <div className="mb-6">
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
            </div>

            {/* Review Mode Explanation */}
            {isReview && currentQuestion.studentAnswer && (
              <div className={`p-4 rounded-lg mb-6 ${
                currentQuestion.isCorrect ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <h3 className="font-bold mb-2">
                  {currentQuestion.isCorrect ? 'Correct!' : 'Incorrect'}
                </h3>
                <p className="text-gray-700">{currentQuestion.explanation}</p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="btn-secondary"
              >
                Previous
              </button>
              
              {isLastQuestion ? (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || isReview}
                  className="btn-primary"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="btn-primary"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  )
} 
'use client'

interface Question {
  id: string
  content: string
  options: string[]
  answer: string
  explanation: string
  studentAnswer?: string
  isCorrect?: boolean
}

interface WorksheetAnalytics {
  questions: Question[]
  score: number
  completedAt: string
  timeSpent?: number
}

export default function WorksheetAnalytics({ questions, score, completedAt, timeSpent }: WorksheetAnalytics) {
  // Calculate analytics
  const totalQuestions = questions.length
  const correctAnswers = questions.filter(q => q.isCorrect).length
  const incorrectAnswers = questions.filter(q => !q.isCorrect && q.studentAnswer).length

  // Group questions by correctness for pattern analysis
  const questionsByCorrectness = questions.reduce((acc, q) => {
    if (!q.studentAnswer) return acc
    if (q.isCorrect) {
      acc.correct.push(q)
    } else {
      acc.incorrect.push(q)
    }
    return acc
  }, { correct: [] as Question[], incorrect: [] as Question[] })

  return (
    <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
      <h2 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-6">Worksheet Analytics</h2>
      
      {/* Score Overview */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-8">
        <div className="bg-bg-blue bg-opacity-10 p-2 sm:p-4 rounded-lg text-center">
          <div className="text-lg sm:text-3xl font-bold text-bg-blue-dark mb-0.5 sm:mb-1">{score}%</div>
          <div className="text-[10px] sm:text-sm text-gray-600">Overall Score</div>
        </div>
        <div className="bg-green-50 p-2 sm:p-4 rounded-lg text-center">
          <div className="text-lg sm:text-3xl font-bold text-green-600 mb-0.5 sm:mb-1">{correctAnswers}</div>
          <div className="text-[10px] sm:text-sm text-gray-600">Correct</div>
        </div>
        <div className="bg-red-50 p-2 sm:p-4 rounded-lg text-center">
          <div className="text-lg sm:text-3xl font-bold text-red-600 mb-0.5 sm:mb-1">{incorrectAnswers}</div>
          <div className="text-[10px] sm:text-sm text-gray-600">Incorrect</div>
        </div>
      </div>

      {/* Time and Completion */}
      <div className="mb-4 sm:mb-8">
        <h3 className="text-sm sm:text-lg font-semibold mb-2 sm:mb-4">Completion Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
          <div className="p-2 sm:p-4 bg-gray-50 rounded-lg">
            <div className="text-[10px] sm:text-sm text-gray-600 mb-0.5 sm:mb-1">Completed On</div>
            <div className="text-xs sm:text-base font-medium break-words">{new Date(completedAt).toLocaleString()}</div>
          </div>
          {timeSpent && (
            <div className="p-2 sm:p-4 bg-gray-50 rounded-lg">
              <div className="text-[10px] sm:text-sm text-gray-600 mb-0.5 sm:mb-1">Time Spent</div>
              <div className="text-xs sm:text-base font-medium">{Math.round(timeSpent / 60)} minutes</div>
            </div>
          )}
        </div>
      </div>

      {/* Question Analysis */}
      <div>
        <h3 className="text-sm sm:text-lg font-semibold mb-2 sm:mb-4">Question Analysis</h3>
        
        {/* Areas for Improvement */}
        {questionsByCorrectness.incorrect.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <h4 className="text-xs sm:text-base font-medium text-red-600 mb-2">Areas for Improvement</h4>
            <ul className="space-y-2">
              {questionsByCorrectness.incorrect.map((q, index) => (
                <li key={q.id} className="bg-red-50 p-2 sm:p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5 sm:mt-1 flex-shrink-0">×</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-base font-medium break-words">{q.content}</div>
                      <div className="text-[10px] sm:text-sm text-gray-600 mt-1 space-y-0.5">
                        <div className="break-words">
                          <span className="font-medium">Your answer:</span> {q.studentAnswer}
                        </div>
                        <div className="break-words">
                          <span className="font-medium">Correct answer:</span> {q.answer}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Strong Areas */}
        {questionsByCorrectness.correct.length > 0 && (
          <div>
            <h4 className="text-xs sm:text-base font-medium text-green-600 mb-2">Strong Areas</h4>
            <ul className="space-y-2">
              {questionsByCorrectness.correct.map((q, index) => (
                <li key={q.id} className="bg-green-50 p-2 sm:p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5 sm:mt-1 flex-shrink-0">✓</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-base font-medium break-words">{q.content}</div>
                      <div className="text-[10px] sm:text-sm text-gray-600 mt-1">
                        <span className="font-medium">Your answer:</span> {q.studentAnswer}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
} 
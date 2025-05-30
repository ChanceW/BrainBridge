'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/app/components/Navigation'

// Define static categories
const STATIC_CATEGORIES = [
  'Math',
  'Science',
  'Social Studies',
  'Geography',
  'Reading',
  'Biology'
] as const

interface Student {
  id: string
  name: string
  userName: string
  grade: number
  categories: string[]
  interests: string[]
}

interface StudentReport {
  id: string
  name: string
  userName: string
  grade: number
  categories: string[]
  totalWorksheets: number
  completedWorksheets: number
  averageScore: number | null
  subjectAverages: Array<{
    subject: string
    averageScore: number
  }>
  recentWorksheets: Array<{
    id: string
    title: string
    subject: string
    status: string
    score: number | null
    startedAt: string | null
    completedAt: string | null
    createdAt: string
  }>
}

export default function ParentDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [studentReports, setStudentReports] = useState<StudentReport[]>([])
  const [loading, setLoading] = useState(true)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState<'students' | 'reports'>('students')
  const [newInterest, setNewInterest] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/parent/login')
    } else if (status === 'authenticated') {
      fetchStudents()
      fetchStudentReports()
    }
  }, [status, router])

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students')
      const data = await response.json()
      setStudents(data)
    } catch (error) {
      console.error('Error fetching students:', error)
      setError('Failed to fetch students')
    } finally {
      setLoading(false)
    }
  }

  const fetchStudentReports = async () => {
    try {
      const response = await fetch('/api/students/reports')
      const data = await response.json()
      setStudentReports(data)
    } catch (error) {
      console.error('Error fetching student reports:', error)
      setError('Failed to fetch student reports')
    }
  }

  const handleUpdateStudent = async (student: Student) => {
    try {
      const response = await fetch('/api/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update student')
      }

      setSuccess('Student updated successfully')
      setEditingStudent(null)
      fetchStudents()
    } catch (error) {
      console.error('Error updating student:', error)
      setError(error instanceof Error ? error.message : 'Failed to update student')
    }
  }

  const handleCategoryChange = (category: string, checked: boolean) => {
    if (!editingStudent) return

    const updatedCategories = checked
      ? [...editingStudent.categories, category]
      : editingStudent.categories.filter(c => c !== category)

    setEditingStudent({
      ...editingStudent,
      categories: updatedCategories
    })
  }

  const handleResetPassword = async (studentId: string) => {
    if (!newPassword) {
      setError('New password is required')
      return
    }

    try {
      const response = await fetch('/api/students/reset-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: studentId, password: newPassword })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to reset password')
      }

      setSuccess('Password reset successfully')
      setNewPassword('')
    } catch (error) {
      console.error('Error resetting password:', error)
      setError(error instanceof Error ? error.message : 'Failed to reset password')
    }
  }

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to delete this student?')) {
      return
    }

    try {
      const response = await fetch(`/api/students?id=${studentId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete student')
      }

      setSuccess('Student deleted successfully')
      fetchStudents()
    } catch (error) {
      console.error('Error deleting student:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete student')
    }
  }

  const handleAddInterest = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!editingStudent) return

    if (e.key === 'Enter' && newInterest.trim()) {
      e.preventDefault()
      const trimmedInterest = newInterest.trim()
      
      // Don't add duplicate interests
      if (!editingStudent.interests.includes(trimmedInterest)) {
        setEditingStudent({
          ...editingStudent,
          interests: [...editingStudent.interests, trimmedInterest]
        })
      }
      setNewInterest('')
    }
  }

  const handleRemoveInterest = (interestToRemove: string) => {
    if (!editingStudent) return

    setEditingStudent({
      ...editingStudent,
      interests: editingStudent.interests.filter(interest => interest !== interestToRemove)
    })
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
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-serif font-bold">
              Parent Dashboard
            </h1>
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('students')}
                className={`px-4 py-2 rounded-lg ${
                  activeTab === 'students'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Students
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`px-4 py-2 rounded-lg ${
                  activeTab === 'reports'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Reports
              </button>
              {activeTab === 'students' && (
                <button
                  onClick={() => router.push('/parent/students/add')}
                  className="btn-primary"
                >
                  Add Student
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4">
              {success}
            </div>
          )}

          {activeTab === 'students' ? (
            students.length === 0 ? (
              <div className="text-center p-8 bg-gray-50 rounded-lg">
                <p>No students added yet. Add your first student to get started!</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="p-6 bg-white rounded-lg shadow-md"
                  >
                    {editingStudent?.id === student.id ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Name</label>
                          <input
                            type="text"
                            value={editingStudent.name}
                            onChange={(e) => setEditingStudent({
                              ...editingStudent,
                              name: e.target.value
                            })}
                            className="input-field w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Username</label>
                          <input
                            type="text"
                            value={editingStudent.userName}
                            onChange={(e) => setEditingStudent({
                              ...editingStudent,
                              userName: e.target.value
                            })}
                            className="input-field w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Grade</label>
                          <input
                            type="number"
                            value={editingStudent.grade}
                            onChange={(e) => setEditingStudent({
                              ...editingStudent,
                              grade: parseInt(e.target.value)
                            })}
                            className="input-field w-full"
                            min="1"
                            max="12"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Categories
                          </label>
                          <div className="space-y-2">
                            {STATIC_CATEGORIES.map((category) => (
                              <label key={category} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={editingStudent.categories.includes(category)}
                                  onChange={(e) => handleCategoryChange(category, e.target.checked)}
                                  className="rounded border-gray-300 text-blue-600 mr-2"
                                />
                                {category}
                              </label>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Interests
                          </label>
                          <div className="space-y-3">
                            {/* Interest Tags */}
                            <div className="flex flex-wrap gap-2">
                              {editingStudent.interests.map((interest) => (
                                <div
                                  key={interest}
                                  className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                                >
                                  <span>{interest}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveInterest(interest)}
                                    className="text-blue-600 hover:text-blue-800 focus:outline-none"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                            {/* Add Interest Input */}
                            <div className="relative">
                              <input
                                type="text"
                                value={newInterest}
                                onChange={(e) => setNewInterest(e.target.value)}
                                onKeyDown={handleAddInterest}
                                placeholder="Type an interest and press Enter"
                                className="input-field w-full pr-24"
                              />
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                                Press Enter to add
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateStudent(editingStudent)}
                            className="btn-primary flex-1"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingStudent(null)
                              setNewInterest('')
                            }}
                            className="btn-secondary flex-1"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-xl font-bold mb-2">{student.name}</h2>
                        <p className="text-gray-600 mb-1">Username: {student.userName}</p>
                        <p className="text-gray-600 mb-1">Grade: {student.grade}</p>
                        <p className="text-gray-600 mb-1">Categories: {student.categories.join(', ') || 'None'}</p>
                        <div className="text-gray-600 mb-4">
                          <span className="mr-1">Interests:</span>
                          {student.interests.length > 0 ? (
                            <div className="inline-flex flex-wrap gap-1">
                              {student.interests.map((interest) => (
                                <span
                                  key={interest}
                                  className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-sm"
                                >
                                  {interest}
                                </span>
                              ))}
                            </div>
                          ) : (
                            'None'
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <button
                            onClick={() => setEditingStudent(student)}
                            className="btn-primary w-full"
                          >
                            Edit
                          </button>
                          
                          <div className="flex gap-2">
                            <input
                              type="password"
                              placeholder="New password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="input-field flex-1"
                            />
                            <button
                              onClick={() => handleResetPassword(student.id)}
                              className="btn-secondary whitespace-nowrap"
                            >
                              Reset Password
                            </button>
                          </div>

                          <button
                            onClick={() => handleDeleteStudent(student.id)}
                            className="text-red-600 hover:text-red-800 text-sm w-full"
                          >
                            Delete Student
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="space-y-8">
              {studentReports.map((report) => (
                <div key={report.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">{report.name}</h2>
                      <p className="text-gray-600">Grade {report.grade}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Total Worksheets: {report.totalWorksheets}</p>
                      <p className="text-sm text-gray-600">Completed: {report.completedWorksheets}</p>
                      {report.averageScore !== null && (
                        <p className="text-lg font-semibold text-blue-600">
                          Average Score: {report.averageScore}%
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Subject Performance */}
                  {report.subjectAverages.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3">Subject Performance</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {report.subjectAverages.map(({ subject, averageScore }) => (
                          <div
                            key={subject}
                            className="bg-gray-50 rounded-lg p-3 text-center"
                          >
                            <p className="text-sm text-gray-600 mb-1">{subject}</p>
                            <p className="text-lg font-semibold text-blue-600">
                              {averageScore}%
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Worksheets */}
                  {report.recentWorksheets.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Recent Worksheets</h3>
                      <div className="space-y-3">
                        {report.recentWorksheets.map((worksheet) => (
                          <div
                            key={worksheet.id}
                            className="flex justify-between items-center bg-gray-50 rounded-lg p-3"
                          >
                            <div>
                              <p className="font-medium">{worksheet.title}</p>
                              <p className="text-sm text-gray-600">
                                {worksheet.subject} • {new Date(worksheet.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">
                                Status: {worksheet.status}
                              </p>
                              {worksheet.score !== null && (
                                <p className="font-semibold text-blue-600">
                                  Score: {worksheet.score}%
                                </p>
                              )}
                              <button
                                onClick={() => router.push(`/parent/worksheet/${worksheet.id}`)}
                                className="mt-2 btn-secondary text-sm"
                              >
                                Review Worksheet
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
} 
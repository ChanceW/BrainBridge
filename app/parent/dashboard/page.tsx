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

export default function ParentDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/parent/login')
    } else if (status === 'authenticated') {
      fetchStudents()
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: studentId, newPassword })
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
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-serif font-bold">
              Parent Dashboard
            </h1>
            <button
              onClick={() => router.push('/parent/students/add')}
              className="btn-primary"
            >
              Add Student
            </button>
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

          {students.length === 0 ? (
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
                        <label className="block text-sm font-medium text-gray-700">Interests (comma-separated)</label>
                        <input
                          type="text"
                          value={editingStudent.interests.join(', ')}
                          onChange={(e) => setEditingStudent({
                            ...editingStudent,
                            interests: e.target.value.split(',').map(s => s.trim())
                          })}
                          className="input-field w-full"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateStudent(editingStudent)}
                          className="btn-primary flex-1"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingStudent(null)}
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
                      <p className="text-gray-600 mb-4">Interests: {student.interests.join(', ') || 'None'}</p>
                      
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
          )}
        </div>
      </main>
    </>
  )
} 
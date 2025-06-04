import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import ParentDashboard from '@/app/parent/dashboard/page'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}))

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}))

describe('Parent Dashboard', () => {
  const mockRouter = {
    push: jest.fn(),
  }

  const mockStudents = [
    {
      id: 'clg123456789012345678901234',
      name: 'John Doe',
      userName: 'johndoe',
      grade: 5,
      categories: ['Math', 'Science'],
      interests: ['Space', 'Robots'],
    },
    {
      id: 'clg234567890123456789012345',
      name: 'Jane Smith',
      userName: 'janesmith',
      grade: 4,
      categories: ['Reading', 'Geography'],
      interests: ['Animals', 'Nature'],
    },
  ]

  const mockStudentReports = [
    {
      id: 'clg123456789012345678901234',
      name: 'John Doe',
      userName: 'johndoe',
      grade: 5,
      categories: ['Math', 'Science'],
      totalWorksheets: 12,
      completedWorksheets: 10,
      averageScore: 85,
      subjectAverages: [
        { subject: 'Math', averageScore: 90 },
        { subject: 'Science', averageScore: 80 }
      ],
      recentWorksheets: [
        {
          id: 'clw123456789012345678901234',
          title: 'Math Practice',
          subject: 'Math',
          status: 'COMPLETED',
          score: 95,
          startedAt: '2024-03-10T10:00:00Z',
          completedAt: '2024-03-10T10:30:00Z',
          createdAt: '2024-03-10T09:00:00Z'
        }
      ]
    },
    {
      id: 'clg234567890123456789012345',
      name: 'Jane Smith',
      userName: 'janesmith',
      grade: 4,
      categories: ['Reading', 'Geography'],
      totalWorksheets: 10,
      completedWorksheets: 8,
      averageScore: 92,
      subjectAverages: [
        { subject: 'Reading', averageScore: 95 },
        { subject: 'Geography', averageScore: 89 }
      ],
      recentWorksheets: [
        {
          id: 'clw234567890123456789012345',
          title: 'Geography Quiz',
          subject: 'Geography',
          status: 'COMPLETED',
          score: 90,
          startedAt: '2024-03-12T10:00:00Z',
          completedAt: '2024-03-12T10:30:00Z',
          createdAt: '2024-03-12T09:00:00Z'
        }
      ]
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams())
    ;(useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: 'parent1',
          name: 'Parent User',
          email: 'parent@example.com',
          role: 'parent',
        },
      },
      status: 'authenticated',
    })

    // Mock fetch for students and reports with proper response objects
    global.fetch = jest.fn()
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockStudents),
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockStudentReports),
      }))
  })

  it('should render dashboard with students tab by default', async () => {
    render(<ParentDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Parent Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Students')).toBeInTheDocument()
      expect(screen.getByText('Reports')).toBeInTheDocument()
      expect(screen.getByText('Add Student')).toBeInTheDocument()
    })

    // Check if students are displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
  })

  it('should switch to reports tab', async () => {
    render(<ParentDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Reports')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Reports'))

    // Check if reports are displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('85%')).toBeInTheDocument()
    expect(screen.getByText('92%')).toBeInTheDocument()
    expect(screen.getAllByText('Math').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Science').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Reading').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Geography').length).toBeGreaterThan(0)
  })

  it('should navigate to add student page', async () => {
    render(<ParentDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Add Student')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Add Student'))
    expect(mockRouter.push).toHaveBeenCalledWith('/parent/students/add')
  })

  it('should handle student deletion', async () => {
    window.confirm = jest.fn(() => true)
    // Simulate clicking delete and confirming via modal
    global.fetch = jest.fn()
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockStudents),
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockStudentReports),
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      }))

    render(<ParentDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Find and click delete button for John Doe
    const deleteButtons = screen.getAllByRole('button', { name: /delete student/i })
    fireEvent.click(deleteButtons[0])

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this student?')
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/students?id=clg123456789012345678901234',
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })

  it('should handle student editing', async () => {
    render(<ParentDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Find and click edit button for John Doe
    const editButtons = screen.getAllByRole('button', { name: /edit/i })
    fireEvent.click(editButtons[0])

    // Check if edit form is displayed (fallback to getByText if getByLabelText fails)
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Grade')).toBeInTheDocument()
    expect(screen.getByText('Math')).toBeInTheDocument()
    expect(screen.getByText('Science')).toBeInTheDocument()
  })

  it('should handle unauthorized access', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    render(<ParentDashboard />)
    
    expect(mockRouter.push).toHaveBeenCalledWith('/parent/login')
  })

  it('should handle API errors gracefully', async () => {
    // Mock fetch to return an error response
    global.fetch = jest.fn()
      .mockImplementationOnce(() => Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to fetch students' }),
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockStudentReports),
      }))

    render(<ParentDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch students')).toBeInTheDocument()
    })
  })

  it('should handle network errors', async () => {
    // Mock fetch to throw a network error
    global.fetch = jest.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockStudentReports),
      }))

    render(<ParentDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('should handle student deletion with error', async () => {
    window.confirm = jest.fn(() => true)
    
    // Mock successful fetch for initial data
    global.fetch = jest.fn()
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockStudents),
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockStudentReports),
      }))
      // Mock failed delete request
      .mockImplementationOnce(() => Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to delete student' }),
      }))

    render(<ParentDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByRole('button', { name: /delete student/i })
    fireEvent.click(deleteButtons[0])

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/students?id=clg123456789012345678901234',
        expect.objectContaining({ method: 'DELETE' })
      )
      expect(screen.getByText('Failed to delete student')).toBeInTheDocument()
    })
  })
}) 
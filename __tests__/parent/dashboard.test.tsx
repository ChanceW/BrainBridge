import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
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
      id: '1',
      name: 'John Doe',
      userName: 'johndoe',
      grade: 5,
      categories: ['Math', 'Science'],
      interests: ['Space', 'Robots'],
    },
    {
      id: '2',
      name: 'Jane Smith',
      userName: 'janesmith',
      grade: 4,
      categories: ['Reading', 'Geography'],
      interests: ['Animals', 'Nature'],
    },
  ]

  const mockStudentReports = [
    {
      id: '1',
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
          id: 'w1',
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
      id: '2',
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
          id: 'w2',
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

    // Mock fetch for students and reports
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
        json: () => Promise.resolve({ message: 'Student deleted successfully' }),
      }))

    render(<ParentDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Find and click delete button for John Doe
    const deleteButtons = screen.getAllByRole('button', { name: /delete student/i })
    fireEvent.click(deleteButtons[0])

    // Modal should appear
    await waitFor(() => {
      expect(screen.getByText('Delete Account')).toBeInTheDocument()
    })

    // Confirm deletion in modal
    const deleteButtonsInModal = screen.getAllByRole('button', { name: /delete/i })
    const confirmButton = deleteButtonsInModal[deleteButtonsInModal.length - 1]
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/students?id=1',
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
    global.fetch = jest.fn().mockRejectedValueOnce(new Error('Failed to fetch'))

    render(<ParentDashboard />)
    
    await waitFor(() => {
      expect(
        screen.getByText(/failed to fetch students|failed to fetch student reports/i)
      ).toBeInTheDocument()
    })
  })
}) 
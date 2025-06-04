import { render, screen, fireEvent } from '@testing-library/react'
import { useSession, signOut } from 'next-auth/react'
import Navigation from '@/app/components/Navigation'

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}))

describe('Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render logo and navigation links', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    render(<Navigation />)
    
    expect(screen.getByAltText('ThinkDrills Logo')).toBeInTheDocument()
  })

  it('should show user info and logout button when authenticated', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          name: 'John Doe',
          email: 'john@example.com',
          role: 'parent',
        },
      },
      status: 'authenticated',
    })

    render(<Navigation />)
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument()
  })

  it('should handle logout', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          name: 'John Doe',
          email: 'john@example.com',
          role: 'parent',
        },
      },
      status: 'authenticated',
    })

    render(<Navigation />)
    
    fireEvent.click(screen.getByRole('button', { name: /log out/i }))
    
    expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/' })
  })

  it('should show student name when authenticated as student', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          name: 'Jane Smith',
          userName: 'janesmith',
          role: 'student',
        },
      },
      status: 'authenticated',
    })

    render(<Navigation />)
    
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
  })

  it('should show email when name is not available', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          email: 'user@example.com',
          role: 'parent',
        },
      },
      status: 'authenticated',
    })

    render(<Navigation />)
    
    expect(screen.getByText('user@example.com')).toBeInTheDocument()
  })
}) 
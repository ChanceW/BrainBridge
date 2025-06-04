import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/config'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Get all students for a parent
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const students = await prisma.student.findMany({
      where: {
        parent: {
          email: session.user.email as string
        }
      },
      select: {
        id: true,
        name: true,
        userName: true,
        grade: true,
        categories: true,
        interests: true
      }
    })

    return NextResponse.json(students)
  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create a new student
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const data = await request.json()
    const { name, userName, grade, password, categories, interests } = data

    const parent = await prisma.parent.findUnique({
      where: {
        email: session.user.email as string
      }
    })

    if (!parent) {
      return NextResponse.json(
        { error: 'Parent not found' },
        { status: 404 }
      )
    }

    // Check if userName is already taken
    const existingStudent = await prisma.student.findUnique({
      where: { userName }
    })

    if (existingStudent) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const student = await prisma.student.create({
      data: {
        name,
        userName,
        grade,
        password: hashedPassword,
        categories: categories || [],
        interests: interests || [],
        parentId: parent.id
      },
      select: {
        id: true,
        name: true,
        userName: true,
        grade: true,
        categories: true,
        interests: true
      }
    })

    return NextResponse.json(student)
  } catch (error) {
    console.error('Error creating student:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update a student
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const data = await request.json()
    const { id, name, userName, grade, categories, interests } = data

    // Verify parent owns this student
    const student = await prisma.student.findFirst({
      where: {
        id,
        parent: {
          email: session.user.email as string
        }
      }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Check if new userName is already taken by another student
    if (userName !== student.userName) {
      const existingStudent = await prisma.student.findUnique({
        where: { userName }
      })

      if (existingStudent) {
        return NextResponse.json(
          { error: 'Username already taken' },
          { status: 400 }
        )
      }
    }

    const updatedStudent = await prisma.student.update({
      where: { id },
      data: {
        name,
        userName,
        grade,
        categories,
        interests
      },
      select: {
        id: true,
        name: true,
        userName: true,
        grade: true,
        categories: true,
        interests: true
      }
    })

    return NextResponse.json(updatedStudent)
  } catch (error) {
    console.error('Error updating student:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete a student
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      console.error('Delete student unauthorized - no session or email')
      return NextResponse.json(
        { error: 'Unauthorized - Please log in again' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      console.error('Delete student failed - no ID provided')
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      )
    }

    // Validate ID format (CUIDs are typically 25 characters)
    if (typeof id !== 'string' || id.length < 20) {
      console.error('Delete student failed - invalid ID format:', { id })
      return NextResponse.json(
        { error: 'Invalid student ID format' },
        { status: 400 }
      )
    }

    console.log('Attempting to delete student:', { id, parentEmail: session.user.email })

    // Verify parent owns this student
    const student = await prisma.student.findFirst({
      where: {
        id,
        parent: {
          email: session.user.email as string
        }
      },
      include: {
        worksheets: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    })

    if (!student) {
      console.error('Delete student failed - student not found or not owned by parent:', {
        studentId: id,
        parentEmail: session.user.email,
        error: 'Student not found or not owned by parent'
      })
      return NextResponse.json(
        { error: 'Student not found or you do not have permission to delete this student' },
        { status: 404 }
      )
    }

    // Log if student has associated worksheets
    if (student.worksheets.length > 0) {
      console.log('Student has associated worksheets:', {
        studentId: id,
        worksheetCount: student.worksheets.length,
        worksheets: student.worksheets.map(w => ({ id: w.id, title: w.title, status: w.status }))
      })
    }

    try {
      // First try to delete all worksheets and their questions
      if (student.worksheets.length > 0) {
        console.log('Deleting associated worksheets first...')
        await prisma.worksheet.deleteMany({
          where: { studentId: id }
        })
      }

      // Then delete the student
      await prisma.student.delete({
        where: { id }
      })
      console.log('Student successfully deleted:', { id })
      return NextResponse.json({ success: true })
    } catch (deleteError: any) {
      console.error('Database error while deleting student:', {
        error: deleteError,
        studentId: id,
        parentEmail: session.user.email,
        errorCode: deleteError?.code,
        errorMessage: deleteError?.message,
        errorName: deleteError?.name,
        errorStack: deleteError?.stack
      })
      
      // Provide more specific error message based on the error code
      let errorMessage = 'Failed to delete student'
      if (deleteError?.code === 'P2025') {
        errorMessage = 'Student record not found'
      } else if (deleteError?.code === 'P2003') {
        errorMessage = 'Cannot delete student due to existing references'
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Unexpected error deleting student:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      errorCode: error?.code,
      errorMessage: error?.message
    })
    return NextResponse.json(
      { error: 'Internal server error while deleting student' },
      { status: 500 }
    )
  }
} 
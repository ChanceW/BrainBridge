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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      )
    }

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

    await prisma.student.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting student:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
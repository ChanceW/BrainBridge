import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/config'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For students, verify they own the worksheet
    if (session.user.role === 'student') {
      const student = await prisma.student.findFirst({
        where: {
          userName: session.user.email,
        },
      })

      if (!student) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 })
      }

      const worksheet = await prisma.worksheet.findFirst({
        where: {
          id: params.id,
          studentId: student.id,
        },
        select: {
          id: true,
          title: true,
          description: true,
          subject: true,
          grade: true,
          status: true,
          score: true,
          startedAt: true,
          completedAt: true,
          createdAt: true,
          updatedAt: true,
          questions: {
            select: {
              id: true,
              content: true,
              options: true,
              answer: true,
              explanation: true,
              studentAnswer: true,
              isCorrect: true,
            },
          },
        },
      })

      if (!worksheet) {
        return NextResponse.json({ error: 'Worksheet not found' }, { status: 404 })
      }

      return NextResponse.json(worksheet)
    }

    // For parents, verify they have access to the student's worksheet
    if (session.user.role === 'parent') {
      const worksheet = await prisma.worksheet.findFirst({
        where: {
          id: params.id,
          student: {
            parent: {
              email: session.user.email,
            },
          },
        },
        select: {
          id: true,
          title: true,
          description: true,
          subject: true,
          grade: true,
          status: true,
          score: true,
          startedAt: true,
          completedAt: true,
          createdAt: true,
          updatedAt: true,
          questions: {
            select: {
              id: true,
              content: true,
              options: true,
              answer: true,
              explanation: true,
              studentAnswer: true,
              isCorrect: true,
            },
          },
        },
      })

      if (!worksheet) {
        return NextResponse.json({ error: 'Worksheet not found' }, { status: 404 })
      }

      return NextResponse.json(worksheet)
    }

    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  } catch (error) {
    console.error('Error fetching worksheet:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
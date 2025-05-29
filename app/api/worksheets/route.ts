import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'

type WorksheetStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'

interface Question {
  id: string
  content: string
  options: string[]
  answer: string
  explanation: string
  studentAnswer: string | null
  isCorrect: boolean | null
}

interface WorksheetWithQuestions {
  id: string
  title: string
  description: string
  subject: string
  grade: number
  questions: Question[]
  status: WorksheetStatus
  score: number | null
  startedAt: Date | null
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

// Get worksheets for the logged-in student
export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const student = await prisma.student.findFirst({
      where: {
        userName: session.user.email,
      },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Get today's worksheet and previous worksheets
    const worksheets = await prisma.worksheet.findMany({
      where: {
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
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Separate current and previous worksheets
    const currentWorksheet = worksheets.find((w) => 
      w.createdAt.toDateString() === new Date().toDateString() && 
      w.status !== 'COMPLETED'
    )
    
    const previousWorksheets = worksheets.filter((w) => 
      w.createdAt.toDateString() !== new Date().toDateString() ||
      w.status === 'COMPLETED'
    )

    return NextResponse.json({
      currentWorksheet,
      previousWorksheets,
    })
  } catch (error) {
    console.error('Error fetching worksheets:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update worksheet status and answers
export async function PUT(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { worksheetId, status, answers, reset } = await request.json()

    const student = await prisma.student.findFirst({
      where: {
        userName: session.user.email,
      },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Verify worksheet belongs to student
    const worksheet = await prisma.worksheet.findFirst({
      where: {
        id: worksheetId,
        studentId: student.id,
      },
      select: {
        id: true,
        startedAt: true,
        completedAt: true,
        questions: {
          select: {
            id: true,
            answer: true,
          },
        },
      },
    })

    if (!worksheet) {
      return NextResponse.json({ error: 'Worksheet not found' }, { status: 404 })
    }

    // Calculate score if worksheet is being completed
    let score = null
    if (status === 'COMPLETED' && answers) {
      const totalQuestions = worksheet.questions.length
      const correctAnswers = worksheet.questions.filter((question: { answer: string }, index: number) => 
        question.answer === answers[index]
      ).length
      score = Math.round((correctAnswers / totalQuestions) * 100)
    }

    // If resetting the worksheet, clear all progress
    if (reset) {
      const updatedWorksheet = await prisma.worksheet.update({
        where: {
          id: worksheetId,
        },
        data: {
          status: 'NOT_STARTED',
          score: null,
          startedAt: null,
          completedAt: null,
          questions: {
            updateMany: worksheet.questions.map((question: { id: string }) => ({
              where: { id: question.id },
              data: {
                studentAnswer: null,
                isCorrect: null,
              },
            })),
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

      return NextResponse.json(updatedWorksheet)
    }

    // Update worksheet status and answers
    const updatedWorksheet = await prisma.worksheet.update({
      where: {
        id: worksheetId,
      },
      data: {
        status,
        score,
        startedAt: status === 'IN_PROGRESS' ? new Date() : worksheet.startedAt,
        completedAt: status === 'COMPLETED' ? new Date() : worksheet.completedAt,
        questions: {
          updateMany: answers ? answers.map((answer: string, index: number) => ({
            where: { id: worksheet.questions[index].id },
            data: {
              studentAnswer: answer,
              isCorrect: answer === worksheet.questions[index].answer,
            },
          })) : [],
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

    return NextResponse.json(updatedWorksheet)
  } catch (error) {
    console.error('Error updating worksheet:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
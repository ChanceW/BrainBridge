import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/config'
import { PrismaClient } from '@prisma/client'

export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all students for the parent
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
        worksheets: {
          select: {
            id: true,
            title: true,
            subject: true,
            status: true,
            score: true,
            startedAt: true,
            completedAt: true,
            createdAt: true,
            questions: {
              select: {
                id: true,
                content: true,
                studentAnswer: true,
                isCorrect: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    // Process the data to create student reports
    const studentReports = students.map(student => {
      const completedWorksheets = student.worksheets.filter(w => w.status === 'COMPLETED')
      const totalWorksheets = student.worksheets.length
      const averageScore = completedWorksheets.length > 0
        ? Math.round(completedWorksheets.reduce((acc, w) => acc + (w.score || 0), 0) / completedWorksheets.length)
        : null

      // Calculate subject-wise performance
      const subjectPerformance = completedWorksheets.reduce((acc, worksheet) => {
        const subject = worksheet.subject
        if (!acc[subject]) {
          acc[subject] = { total: 0, count: 0 }
        }
        acc[subject].total += worksheet.score || 0
        acc[subject].count += 1
        return acc
      }, {} as Record<string, { total: number; count: number }>)

      // Calculate average score per subject
      const subjectAverages = Object.entries(subjectPerformance).map(([subject, { total, count }]) => ({
        subject,
        averageScore: Math.round(total / count)
      }))

      return {
        id: student.id,
        name: student.name,
        userName: student.userName,
        grade: student.grade,
        categories: student.categories,
        totalWorksheets,
        completedWorksheets: completedWorksheets.length,
        averageScore,
        subjectAverages,
        recentWorksheets: student.worksheets.slice(0, 5) // Last 5 worksheets
      }
    })

    return NextResponse.json(studentReports)
  } catch (error) {
    console.error('Error fetching student reports:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
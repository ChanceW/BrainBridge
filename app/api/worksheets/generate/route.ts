import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/config'
import prisma from '@/lib/prisma'
import { OpenAIService } from '@/lib/openai/service'

// Main function to generate worksheet questions
async function generateWorksheetQuestions(student: any) {
  // Validate student has categories and interests
  if (!student.categories?.length) {
    throw new Error('Student must have at least one category selected')
  }
  if (!student.interests?.length) {
    throw new Error('Student must have at least one interest selected')
  }
  
  // Randomly select a category from student's categories
  const category = student.categories[Math.floor(Math.random() * student.categories.length)]
  
  // Randomly select an interest from student's interests
  const interest = student.interests[Math.floor(Math.random() * student.interests.length)]
  
  try {
    // Generate questions using OpenAI service
    const questions = await OpenAIService.generateQuestions({
      category,
      interest,
      grade: student.grade
    });

    if (!questions.length) {
      throw new Error('No questions were generated. Please try again.')
    }

    return {
      questions,
      category,
      interest
    }
  } catch (error) {
    console.error('Error generating questions:', error);
    if (error instanceof Error) {
      // Pass through specific error messages from OpenAI service
      throw error;
    }
    throw new Error('Failed to generate questions. Please try again later.');
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
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

    // Check if there's already an incomplete worksheet for today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const existingWorksheet = await prisma.worksheet.findFirst({
      where: {
        studentId: student.id,
        createdAt: {
          gte: today,
        },
        status: {
          not: 'COMPLETED',
        },
      },
    })

    if (existingWorksheet) {
      return NextResponse.json(
        { error: 'Incomplete worksheet already exists for today' },
        { status: 400 }
      )
    }

    try {
      // Generate new worksheet with AI-generated questions
      const { questions, category, interest } = await generateWorksheetQuestions(student)
      
      const worksheet = await prisma.worksheet.create({
        data: {
          title: `${category} Practice - ${interest} Theme`,
          description: `A personalized worksheet focusing on ${category} with ${interest}-themed questions.`,
          subject: category,
          grade: student.grade,
          studentId: student.id,
          questions: {
            create: questions.map(q => ({
              content: q.content,
              options: q.options,
              answer: q.answer,
              explanation: q.explanation,
            }))
          }
        },
        include: {
          questions: true
        }
      })

      return NextResponse.json(worksheet)
    } catch (error) {
      if (error instanceof Error) {
        // Return specific error messages with appropriate status codes
        if (error.message.includes('API key')) {
          return NextResponse.json(
            { error: 'Service configuration error. Please contact support.' },
            { status: 503 }
          )
        }
        if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
          return NextResponse.json(
            { error: 'Service is busy. Please try again in a few moments.' },
            { status: 429 }
          )
        }
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      throw error
    }
  } catch (error) {
    console.error('Error generating worksheet:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
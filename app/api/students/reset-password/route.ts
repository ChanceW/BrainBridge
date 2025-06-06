import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/config'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

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
    const { id, password } = data

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

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.student.update({
      where: { id },
      data: {
        password: hashedPassword
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
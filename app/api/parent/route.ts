import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/config'
import prisma from '@/lib/prisma'

// Delete parent account
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Find parent and verify ownership
    const parent = await prisma.parent.findUnique({
      where: {
        email: session.user.email as string
      },
      include: {
        students: true
      }
    })

    if (!parent) {
      return NextResponse.json(
        { error: 'Parent not found' },
        { status: 404 }
      )
    }

    // Delete all associated students first (this will cascade delete their data)
    await Promise.all(
      parent.students.map(student =>
        prisma.student.delete({
          where: { id: student.id }
        })
      )
    )

    // Delete the parent account
    await prisma.parent.delete({
      where: { id: parent.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting parent account:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
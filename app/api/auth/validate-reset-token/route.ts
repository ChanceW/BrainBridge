import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { message: 'Token is required' },
        { status: 400 }
      )
    }

    // Find parent with this reset token
    const parent = await prisma.parent.findUnique({
      where: { resetToken: token },
    })

    if (!parent) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 400 }
      )
    }

    // Check if token has expired
    if (!parent.resetTokenExpiry || parent.resetTokenExpiry < new Date()) {
      return NextResponse.json(
        { message: 'Token has expired' },
        { status: 400 }
      )
    }

    return NextResponse.json({ valid: true })
  } catch (error) {
    console.error('Token validation error:', error)
    return NextResponse.json(
      { message: 'Failed to validate token' },
      { status: 500 }
    )
  }
} 
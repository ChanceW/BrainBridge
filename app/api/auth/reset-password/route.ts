import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { z } from 'zod'

// Input validation schema
const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = resetPasswordSchema.parse(body)
    
    // Find parent with this reset token
    const parent = await prisma.parent.findUnique({
      where: { resetToken: validatedData.token },
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

    // Hash new password
    const hashedPassword = await hash(validatedData.password, 12)

    // Update password and clear reset token
    await prisma.parent.update({
      where: { resetToken: validatedData.token },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    })

    return NextResponse.json(
      { message: 'Password has been reset successfully' },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('Password reset error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Failed to reset password' },
      { status: 500 }
    )
  }
} 
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import crypto from 'crypto'
import { sendEmail } from '@/lib/email'

// Input validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

// Generate a random token
function generateToken() {
  return crypto.randomBytes(32).toString('hex')
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = forgotPasswordSchema.parse(body)
    
    // Check if email exists
    const parent = await prisma.parent.findUnique({
      where: {
        email: validatedData.email,
      },
    })

    if (!parent) {
      // Return success even if email doesn't exist to prevent email enumeration
      return NextResponse.json(
        { message: 'If an account exists with this email, you will receive a password reset link.' },
        { status: 200 }
      )
    }

    // Generate reset token
    const resetToken = generateToken()
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

    // Store reset token in database
    await prisma.parent.update({
      where: { email: validatedData.email },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    })

    // Generate reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/parent/reset-password?token=${resetToken}`

    // Send email
    await sendEmail({
      to: validatedData.email,
      subject: 'Reset Your Password - ThinkDrills',
      html: `
        <p>Hello ${parent.name},</p>
        <p>You requested to reset your password. Click the link below to reset your password:</p>
        <p><a href="${resetUrl}">Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>ThinkDrills Team</p>
      `,
    })

    return NextResponse.json(
      { message: 'If an account exists with this email, you will receive a password reset link.' },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('Forgot password error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Failed to process request' },
      { status: 500 }
    )
  }
} 
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaClient } from '@prisma/client'
import { compare } from 'bcryptjs'
import type { JWT } from 'next-auth/jwt'
import type { Session } from 'next-auth'
import type { User } from 'next-auth'

const prisma = new PrismaClient()

interface GoogleProfile {
  sub: string
  email: string
  name: string
  picture?: string
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        userName: { label: "Username/Email", type: "text" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.userName || !credentials?.password || !credentials?.role) {
          throw new Error('Missing credentials')
        }

        const userName = credentials.userName as string
        const password = credentials.password as string
        const role = credentials.role as 'student' | 'parent'

        try {
          if (role === 'student') {
            const student = await prisma.student.findUnique({
              where: {
                userName,
              },
            })

            if (!student) {
              throw new Error('Invalid username or password')
            }

            const isValid = await compare(password, student.password)

            if (!isValid) {
              throw new Error('Invalid username or password')
            }

            return {
              id: student.id,
              name: student.name,
              email: student.userName,
              role: 'student',
            } as User
          } else if (role === 'parent') {
            const parent = await prisma.parent.findUnique({
              where: {
                email: userName,
              },
            })

            if (!parent) {
              throw new Error('Invalid email or password')
            }

            if (!parent.password) {
              throw new Error('Please sign in with Google')
            }

            const isValid = await compare(password, parent.password)

            if (!isValid) {
              throw new Error('Invalid email or password')
            }

            return {
              id: parent.id,
              name: parent.name,
              email: parent.email,
              role: 'parent',
            } as User
          }

          throw new Error('Invalid role')
        } catch (error) {
          console.error('Auth error:', error)
          throw error
        }
      }
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/error',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' && profile) {
        try {
          const googleProfile = profile as GoogleProfile
          // Check if user exists
          const existingUser = await prisma.parent.findFirst({
            where: {
              OR: [
                { email: user.email! },
                { googleId: googleProfile.sub }
              ]
            }
          })

          if (existingUser) {
            // Update user if they signed in with Google before
            if (!existingUser.googleId) {
              await prisma.parent.update({
                where: { id: existingUser.id },
                data: {
                  googleId: googleProfile.sub,
                  image: user.image || null,
                }
              })
            }
            // Set the user role for the token
            user.id = existingUser.id
            user.role = 'parent'
            return true
          }

          // Create new user if they don't exist
          const newParent = await prisma.parent.create({
            data: {
              email: user.email!,
              name: user.name!,
              googleId: googleProfile.sub,
              image: user.image || null,
            }
          })
          // Set the user role for the token
          user.id = newParent.id
          user.role = 'parent'
          return true
        } catch (error) {
          console.error('Error during Google sign in:', error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }: { session: Session, token: JWT }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
} 
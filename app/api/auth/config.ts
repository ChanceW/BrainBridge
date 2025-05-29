import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaClient } from '@prisma/client'
import { compare } from 'bcryptjs'

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  providers: [
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

        try {
          if (credentials.role === 'student') {
            const student = await prisma.student.findUnique({
              where: {
                userName: credentials.userName,
              },
            })

            if (!student) {
              throw new Error('Invalid username or password')
            }

            const isValid = await compare(credentials.password, student.password)

            if (!isValid) {
              throw new Error('Invalid username or password')
            }

            return {
              id: student.id,
              name: student.name,
              email: student.userName,
              role: 'student',
            }
          } else if (credentials.role === 'parent') {
            const parent = await prisma.parent.findUnique({
              where: {
                email: credentials.userName,
              },
            })

            if (!parent) {
              throw new Error('Invalid email or password')
            }

            const isValid = await compare(credentials.password, parent.password)

            if (!isValid) {
              throw new Error('Invalid email or password')
            }

            return {
              id: parent.id,
              name: parent.name,
              email: parent.email,
              role: 'parent',
            }
          }

          throw new Error('Invalid role')
        } catch (error) {
          console.error('Auth error:', error)
          throw error
        }
      },
    }),
  ],
  pages: {
    signIn: '/student/login',
    error: '/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
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
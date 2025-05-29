import './globals.css'
import { Providers } from './providers'

export const metadata = {
  title: 'BrainGym - Personalized Learning Platform',
  description: 'AI-powered educational platform providing personalized daily worksheets for students in grades 1-12.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
} 
import './globals.css'
import { Providers } from './providers'

export const metadata = {
  title: 'ThinkDrills - Personalized Learning Platform',
  description: 'AI-powered educational platform providing personalized daily worksheets for students in grades 1-12.',
  icons: {
    icon: '/thinkDrillslogo.png',
    shortcut: '/thinkDrillslogo.png',
    apple: '/thinkDrillslogo.png',
    other: {
      rel: 'apple-touch-icon',
      url: '/thinkDrillslogo.png',
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/thinkDrillslogo.png" />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
} 
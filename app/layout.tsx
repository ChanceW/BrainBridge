import './globals.css'
import { Providers } from './providers'

export const metadata = {
  title: 'ThinkDrills - Personalized Learning Platform',
  description: 'AI-powered educational platform providing personalized daily worksheets for students in grades 1-12.',
  icons: {
    icon: '/ThinkDrillsLogo.png',
    shortcut: '/ThinkDrillsLogo.png',
    apple: '/ThinkDrillsLogo.png',
    other: {
      rel: 'apple-touch-icon',
      url: '/ThinkDrillsLogo.png',
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
        <link rel="icon" href="/ThinkDrillsLogo.png" />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
} 
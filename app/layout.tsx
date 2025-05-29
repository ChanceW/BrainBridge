import './globals.css'
import { Providers } from './providers'

export const metadata = {
  title: 'BrainGym - Personalized Learning Platform',
  description: 'AI-powered educational platform providing personalized daily worksheets for students in grades 1-12.',
  icons: {
    icon: '/BrainGym_Logo_Cropped.png',
    shortcut: '/BrainGym_Logo_Cropped.png',
    apple: '/BrainGym_Logo_Cropped.png',
    other: {
      rel: 'apple-touch-icon',
      url: '/BrainGym_Logo_Cropped.png',
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
        <link rel="icon" href="/BrainGym_Logo_Cropped.png" />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
} 
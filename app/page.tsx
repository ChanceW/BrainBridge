import Image from 'next/image'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full text-center">
        <div className="mb-8">
          <Image
            src="/BB_Logo.svg"
            alt="BrainBridge Logo"
            width={200}
            height={200}
            className="mx-auto"
            priority
          />
        </div>
        
        <h1 className="text-4xl font-serif font-bold mb-4">
          Welcome to BrainBridge
        </h1>
        
        <p className="text-xl mb-8">
          Personalized AI-powered learning for grades 1-12
        </p>

        <div className="flex gap-4 justify-center">
          <Link 
            href="/parent/login" 
            className="btn-primary"
          >
            Parent Login
          </Link>
          
          <Link 
            href="/student/login" 
            className="btn-secondary"
          >
            Student Login
          </Link>
        </div>
      </div>
    </main>
  )
} 
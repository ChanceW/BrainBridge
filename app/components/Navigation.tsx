'use client'

import { signOut, useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'

export default function Navigation() {
  const { data: session } = useSession()

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image
                src="/BB_Logo.svg"
                alt="BrainBridge Logo"
                width={40}
                height={40}
                className="mr-2"
              />
              <span className="text-xl font-serif font-bold">
                Brain<span className="text-bb-orange">Bridge</span>
              </span>
            </Link>
          </div>

          {session && (
            <div className="flex items-center gap-4">
              <span className="text-gray-600">
                {session.user?.name || session.user?.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="btn-secondary"
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
} 
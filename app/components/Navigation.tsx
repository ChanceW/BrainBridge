'use client'

import { signOut, useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'

export default function Navigation() {
  const { data: session } = useSession()

  return (
    <nav className="bg-white shadow-md overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="relative w-[150px] h-[60px]">
                <Image
                  src="/ThinkDrillsLogo.png"
                  alt="ThinkDrills Logo"
                  fill
                  className="object-contain rounded-[15px]"
                />
              </div>
            </Link>
          </div>

          {session && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <svg 
                  className="w-5 h-5 text-gray-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                  />
                </svg>
                <span className="text-gray-600">
                  {session.user?.name || session.user?.email}
                </span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="btn-logout"
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
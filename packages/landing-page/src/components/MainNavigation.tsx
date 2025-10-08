'use client'

import Link from 'next/link'

export default function MainNavigation() {
  console.log('MainNavigation rendering')
  return (
    <nav className="bg-white shadow-sm relative z-50" style={{ pointerEvents: 'auto' }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-indigo-600">Ask Akasha</span>
            </Link>
          </div>
          <div className="flex items-center space-x-6 sm:space-x-4">
            <a
              href="/admin/login"
              className="rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors cursor-pointer w-[100px] sm:w-[140px] text-center"
              onClick={() => console.log('Admin Login clicked')}
            >
              Admin Login
            </a>
            <a
              href="/mobile"
              className="rounded-md border-purple-600 bg-purple-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-700 hover:border-purple-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 transition-colors cursor-pointer w-[100px] sm:w-[140px] text-center"
              onClick={() => console.log('Mobile App clicked')}
            >
              Mobile App
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}

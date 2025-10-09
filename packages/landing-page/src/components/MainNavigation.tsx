'use client'

import Link from 'next/link'

export default function MainNavigation() {
  console.log('MainNavigation rendering')
  return (
    <nav className="bg-white shadow-sm relative z-50" style={{ pointerEvents: 'auto' }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between h-auto sm:h-20 py-4 sm:py-0">
          <div className="flex items-center justify-center sm:justify-start mb-4 sm:mb-0">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-3xl font-bold text-indigo-600">Ask Akasha</span>
            </Link>
          </div>
          <div className="flex items-center justify-center space-x-12 sm:space-x-4">
            <a
              href="/admin/login"
              className="rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors cursor-pointer w-[100px] sm:w-[140px] text-center"
              onClick={() => console.log('Admin Login clicked')}
            >
              Admin Login
            </a>
            <a
              href="/mobile"
              className="rounded-md border-purple-600 bg-purple-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-700 hover:border-purple-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 transition-colors cursor-pointer w-[100px] sm:w-[140px] text-center ml-6 sm:ml-0"
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

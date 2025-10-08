'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface AdminHeaderProps {
  user: {
    email?: string;
    phone?: string;
    orgName?: string;
    orgId: string;
    role?: string;
    currentRole?: string;
  } | null;
  documentStats: { count: number };
  onLogout: () => void;
}

export default function AdminHeader({ user, documentStats, onLogout }: AdminHeaderProps) {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/')
  }

  return (
    <nav className="bg-indigo-600 shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-white">Ask Akasha</span>
              <span className="ml-4 text-sm text-indigo-200">Admin Dashboard</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-indigo-200">
              <div className="font-medium">{user?.email || 'Admin'}</div>
              <div className="text-xs">Org: {user?.orgName || 'No Organization'}</div>
            </div>
            
            <button
              onClick={onLogout}
              className="bg-indigo-700 hover:bg-indigo-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <div className="bg-indigo-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Link
              href="/admin/search"
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                isActive('/admin/search') 
                  ? 'border-white text-white' 
                  : 'border-transparent text-indigo-200 hover:text-white hover:border-indigo-300'
              }`}
            >
              Search
            </Link>
            
            <Link
              href="/admin/organizations"
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                isActive('/admin/organizations') 
                  ? 'border-white text-white' 
                  : 'border-transparent text-indigo-200 hover:text-white hover:border-indigo-300'
              }`}
            >
              Organizations
            </Link>
            
            <Link
              href="/admin/documents"
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                isActive('/admin/documents') 
                  ? 'border-white text-white' 
                  : 'border-transparent text-indigo-200 hover:text-white hover:border-indigo-300'
              }`}
            >
              Documents ({documentStats.count})
            </Link>
            
            <Link
              href="/admin/chat"
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                isActive('/admin/chat') 
                  ? 'border-white text-white' 
                  : 'border-transparent text-indigo-200 hover:text-white hover:border-indigo-300'
              }`}
            >
              Chat
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

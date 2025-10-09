'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

function VerifyEmailInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { verifyEmail } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const token = searchParams.get('token')

  useEffect(() => {
    if (token) {
      handleVerification()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const handleVerification = async () => {
    if (!token) {
      setError('No verification token provided')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      await verifyEmail(token)
      setSuccess(true)
      
      // Redirect to admin dashboard after 3 seconds
      setTimeout(() => {
        router.push('/admin/search')
      }, 3000)
    } catch (err: unknown) {
      setError((err as Error).message || 'Email verification failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendVerification = async () => {
    // This would require the email address, which we don't have in the URL
    // For now, redirect to login page where user can request resend
    router.push('/admin/login?resend=true')
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Email Verified!
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Your email has been successfully verified. You will be redirected to your dashboard shortly.
            </p>
            <div className="mt-6">
              <Link
                href="/admin/search"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100">
            <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isLoading ? 'Verifying Email...' : 'Email Verification'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isLoading 
              ? 'Please wait while we verify your email address...'
              : 'We are verifying your email address. This may take a moment.'
            }
          </p>
        </div>

        {isLoading && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Verification Failed
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={handleResendVerification}
                    className="text-sm font-medium text-red-600 hover:text-red-500"
                  >
                    Resend verification email
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="text-center">
          <Link
            href="/admin/login"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            ← Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"><p>Loading...</p></div>}>
      <VerifyEmailInner />
    </Suspense>
  )
}

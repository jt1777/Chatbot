import Link from 'next/link'
import { DevicePhoneMobileIcon, QrCodeIcon } from '@heroicons/react/24/outline'

export default function MobilePage() {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Download Ask Akasha Mobile
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Access your knowledge base on the go with our mobile app. Available for iOS and Android.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-2xl">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            {/* iOS Download */}
            <div className="rounded-2xl bg-gray-50 p-8 text-center">
              <DevicePhoneMobileIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">iOS App</h3>
              <p className="mt-2 text-sm text-gray-600">
                Download from the App Store
              </p>
              <div className="mt-6">
                <a
                  href="#"
                  className="inline-flex items-center rounded-md bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800"
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  Download for iOS
                </a>
              </div>
            </div>

            {/* Android Download */}
            <div className="rounded-2xl bg-gray-50 p-8 text-center">
              <DevicePhoneMobileIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Android App</h3>
              <p className="mt-2 text-sm text-gray-600">
                Download from Google Play
              </p>
              <div className="mt-6">
                <a
                  href="#"
                  className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                  Download for Android
                </a>
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="mt-16 text-center">
            <div className="mx-auto max-w-md">
              <QrCodeIcon className="mx-auto h-16 w-16 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Scan to Download</h3>
              <p className="mt-2 text-sm text-gray-600">
                Scan this QR code with your phone to download the app
              </p>
              <div className="mt-6 flex justify-center">
                <div className="h-32 w-32 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-xs text-gray-500">QR Code</span>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mt-16">
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-8">Mobile App Features</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-16.5 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <h4 className="mt-4 text-sm font-semibold text-gray-900">Offline Access</h4>
                <p className="mt-2 text-sm text-gray-600">Access your knowledge base even without internet connection</p>
              </div>
              <div className="text-center">
                <div className="mx-auto h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.5c0-.83.67-1.5 1.5-1.5h.75c.83 0 1.5.67 1.5 1.5v.75c0 .83-.67 1.5-1.5 1.5h-.75c-.83 0-1.5-.67-1.5-1.5v-.75z" />
                  </svg>
                </div>
                <h4 className="mt-4 text-sm font-semibold text-gray-900">Quick Search</h4>
                <p className="mt-2 text-sm text-gray-600">Find information instantly with AI-powered search</p>
              </div>
              <div className="text-center">
                <div className="mx-auto h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <h4 className="mt-4 text-sm font-semibold text-gray-900">Team Collaboration</h4>
                <p className="mt-2 text-sm text-gray-600">Share knowledge with your team members</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <Link
            href="/"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}

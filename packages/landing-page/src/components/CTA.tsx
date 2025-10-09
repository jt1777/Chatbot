import Link from 'next/link'
import { ArrowRightIcon } from '@heroicons/react/24/outline'

export default function CTA() {
  return (
    <div className="bg-indigo-600">
      <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Coming Soon!
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-indigo-200">
            Offline desktop app for users with proprietary documents, powered by local AI and database for 100% privacy.  Follow us on X for updates.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a
              href="https://x.com/askakasha"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white w-[200px] text-center flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Follow us
            </a>
            {/*
            <Link 
              href="/mobile" 
              className="rounded-md border-2 border-white bg-transparent px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-white hover:text-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white w-[200px] text-center"
            >
              Download mobile app
            </Link>
            */}
          </div>
        </div>
      </div>
    </div>
  )
}

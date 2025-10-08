import Link from 'next/link'
import { ArrowRightIcon } from '@heroicons/react/24/outline'

export default function CTA() {
  return (
    <div className="bg-indigo-600">
      <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to build your AI knowledge base?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-indigo-200">
            Join organizations worldwide who are already using Ask Akasha to transform their knowledge management.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/admin/register"
              className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white w-[200px] text-center"
            >
              Start building today
            </Link>
            <Link 
              href="/mobile" 
              className="rounded-md border-2 border-white bg-transparent px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-white hover:text-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white w-[200px] text-center"
            >
              Download mobile app
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

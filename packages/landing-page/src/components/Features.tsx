import {
  DocumentTextIcon,
  CloudIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  CogIcon,
} from '@heroicons/react/24/outline'

const features = [
  {
    name: 'Document Upload',
    description: 'Upload PDFs or scan web pages to build your knowledge base. Support for scanned PDFs and automatic text extraction.',
    icon: DocumentTextIcon,
  },
  {
    name: 'Cloud Storage',
    description: 'Secure cloud storage for all your documents with automatic backup and version control. Access your knowledge base from anywhere.',
    icon: CloudIcon,
  },
  {
    name: 'Secure Access',
    description: 'Role-based access control with admin and user permissions. Invite team members and control who can access what information.',
    icon: ShieldCheckIcon,
  },
  {
    name: 'Public or Private Organizations',
    description: 'Create organizations and share with anyone publicly or privately.',
    icon: UserGroupIcon,
  },
  {
    name: 'AI Chat Interface',
    description: 'Get instant, accurate answers based on your uploaded documents on Strict Mode or query AI on General Mode for a broader response.',
    icon: ChatBubbleLeftRightIcon,
  },
  {
    name: 'Admin Dashboard',
    description: 'Comprehensive admin panel to manage documents, users, organizations, and search settings.',
    icon: CogIcon,
  },
]

export default function Features() {
  return (
        <div className="pt-16 pb-8 sm:pt-20 sm:pb-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-xl font-semibold leading-7 text-indigo-600">Everything you need</h2>
          <p className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Powerful features for knowledge management
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Ask Akasha provides all the tools you need to build, manage, and query your knowledge base with AI-powered insights.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
            {features.map((feature) => (
              <div key={feature.name} className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                    <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  {feature.name}
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">{feature.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}

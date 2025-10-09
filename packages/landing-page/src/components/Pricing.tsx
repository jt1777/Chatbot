import { CheckIcon } from '@heroicons/react/24/outline'

const tiers = [
  {
    name: 'Free',
    id: 'tier-free',
    href: '/mobile',
    priceMonthly: '$0',
    description: 'Try as a Guest or register as a User.',
    features: [
      'Search and join public organizations',
      'AI chat Strict mode for Guests',
      'Full AI chat for Users',
      'Mobile app access only',
      
    ],
    mostPopular: false,
  },
  {
    name: 'Admin',
    id: 'tier-pro',
    href: '/admin/register',
    priceMonthly: 'Pay As You Go',
    description: 'Ideal for individuals or small teams.',
    features: [
      'Upload up to 100 documents',
      'Create up to 10 organizations',
      'Customizable AI search features',
      'Online support',
      'Website Admin dashboard',
      'User management',
      'Online Payment via Stripe',
    ],
    mostPopular: true,
  },
  {
    name: 'Enterprise',
    id: 'tier-enterprise',
    href: '/contact',
    priceMonthly: 'Custom Pricing',
    description: 'For Corporates or Non-Profits.',
    features: [
      'Unlimited documents',
      'Unlimited organizations',
      'Full Admin features',
      'Custom AI models',
      'Dedicated support',
      'Custom branding',
      'Online Payment via Stripe',
    ],
    mostPopular: false,
  },
]

export default function Pricing() {
  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-xl font-semibold leading-7 text-indigo-600">Pricing</h2>
          <p className="mt-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Flexible Plans for Everyone
          </p>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-600">
          Start free as a Guest or User, or register as an Admin in order to create an Organization. All plans include mobile app access and core AI chat.
        </p>
        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-8">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className="flex flex-col justify-between rounded-3xl p-8 ring-1 ring-gray-200 xl:p-10 hover:ring-2 hover:ring-indigo-600 transition-all duration-200"
            >
              <div>
                <div className="flex items-center justify-between gap-x-4">
                  <h3
                    id={tier.id}
                    className="text-lg font-semibold leading-8 text-gray-900"
                  >
                    {tier.name}
                  </h3>
                </div>
                <p className="mt-4 text-sm leading-6 text-gray-600">{tier.description}</p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-gray-900">
                    {tier.priceMonthly}
                  </span>
                  {tier.priceMonthly !== 'Custom' && (
                    <span className="text-sm font-semibold leading-6 text-gray-600"></span>
                  )}
                </p>
                <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <CheckIcon className="h-6 w-5 flex-none text-indigo-600" aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <a
                href={tier.href}
                aria-describedby={tier.id}
                className="mt-8 block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 text-indigo-600 ring-1 ring-inset ring-indigo-200 hover:bg-indigo-600 hover:text-white hover:ring-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-all duration-200"
              >
                {tier.priceMonthly === 'Custom' ? 'Contact us' : 'Get started today'}
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

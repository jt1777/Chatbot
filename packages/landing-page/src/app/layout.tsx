import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ConditionalNavigation from '@/components/ConditionalNavigation'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ask Akasha - AI Knowledge Base Platform',
  description: 'Build specialized AI assistants powered by your own documents. Upload PDFs, web content, and more to create a custom knowledge base for your organization.',
  keywords: 'AI, knowledge base, document management, RAG, chatbot, organization, team collaboration',
  authors: [{ name: 'Ask Akasha Team' }],
  icons: {
    icon: '/favicon.png',
  },
  openGraph: {
    title: 'Ask Akasha - AI Knowledge Base Platform',
    description: 'Build specialized AI assistants powered by your own documents.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ask Akasha - AI Knowledge Base Platform',
    description: 'Build specialized AI assistants powered by your own documents.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
      </head>
      <body className={inter.className}>
        <ConditionalNavigation />
        {children}
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </body>
    </html>
  )
}
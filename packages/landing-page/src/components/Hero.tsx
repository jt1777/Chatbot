'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRightIcon, PlayIcon } from '@heroicons/react/24/outline'

export default function Hero() {
  const [email, setEmail] = useState('')
  const [currentSlide, setCurrentSlide] = useState(0)

  const handleGetStarted = () => {
    // TODO: Implement email capture for early access
    console.log('Email captured:', email)
  }

  // Auto-rotate slides every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const slides = [
    {
      image: '/hero3.jpeg',
      title: 'Search, Join, or Create Organizations',
      description: 'Easily create multiple organizations, then share your knowledge base with public or private users.',
      alt: 'AI-powered dashboard with data visualizations'
    },
    {
      image: '/hero1.jpeg',
      title: 'Curate Specialized Knowledge',
      description: 'Build a comprehensive, specialized body of knowledge by uploading documents, PDFs, and web content tailored to your organization\'s needs.',
      alt: 'Human and AI collaboration concept'
    },
    {
      image: '/hero2.jpeg',
      title: 'AI-Powered Insights',
      description: 'Leverage advanced AI to summarize complex information, ask intelligent questions, and get instant answers from your curated knowledge base.',
      alt: 'Digital brain with data visualization overlay'
    }
  ]


  return (
    <div className="relative isolate">
      <div
        className="absolute inset-x-0 -top-40 -z-20 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        aria-hidden="true"
      >
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
        />
      </div>
      <div className="w-full">
        {/* Image Carousel - Full Width */}
        <div className="relative w-full mb-16">
          <div className="relative overflow-hidden bg-gray-100">
                    <div className="relative h-96 sm:h-[400px] lg:h-[450px]">
              <img
                src={slides[currentSlide].image}
                alt={slides[currentSlide].alt}
                className="absolute inset-0 w-full h-full object-cover"
                onLoad={() => console.log('Image loaded:', slides[currentSlide].image)}
                onError={(e) => console.error('Image error:', e, slides[currentSlide].image)}
              />
              {/* <div className="absolute inset-0 bg-black bg-opacity-40" /> */}
              
              {/* Slide content overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white px-6 max-w-2xl">
                  {/* Text with clean outline effect */}
                  <div className="text-center px-6 max-w-2xl">
                    <h2 
                      className="text-3xl font-bold mb-4 sm:text-4xl text-white"
                      style={{
                        textShadow: `
                          2px 2px 0 #000,
                          -2px -2px 0 #000,
                          2px -2px 0 #000,
                          -2px 2px 0 #000,
                          0 2px 0 #000,
                          0 -2px 0 #000,
                          2px 0 0 #000,
                          -2px 0 0 #000
                        `
                      }}
                    >
                      {slides[currentSlide].title}
                    </h2>
                    <p 
                      className="text-lg sm:text-xl text-white"
                      style={{
                        textShadow: `
                          1px 1px 0 #000,
                          -1px -1px 0 #000,
                          1px -1px 0 #000,
                          -1px 1px 0 #000,
                          0 1px 0 #000,
                          0 -1px 0 #000,
                          1px 0 0 #000,
                          -1px 0 0 #000
                        `
                      }}
                    >
                      {slides[currentSlide].description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Slide indicators */}
          <div className="flex justify-center mt-6">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  index === currentSlide 
                    ? 'bg-indigo-600' 
                    : 'bg-gray-300 hover:bg-gray-400'
                } ${index > 0 ? 'ml-3 sm:ml-2' : ''}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
        
        {/* Main heading */}
        <div className="text-center mb-16 px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Build Your AI Knowledge Base
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
            Ask Akasha helps individuals and organizations create specialized AI assistants powered by their own documents. 
            Upload PDF documents and web content to build a custom knowledge base that you or your team can query instantly.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="mt-16 flex items-center justify-center gap-x-6 px-6 lg:px-8">
          <Link
            href="/admin/login"
            className="rounded-md bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 w-[200px] text-center"
          >
            Admin Login
          </Link>
          <Link
            href="/mobile"
            className="rounded-md border-purple-600 bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 hover:border-purple-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 w-[200px] text-center"
          >
            Mobile App
          </Link>
        </div>
      </div>
      <div
        className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
        aria-hidden="true"
      >
        <div
          className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
        />
      </div>
    </div>
  )
}

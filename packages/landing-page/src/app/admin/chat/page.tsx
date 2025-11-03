'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminHeader from '@/components/AdminHeader'
import AdminChatInterface from '@/components/AdminChatInterface'
import { useAuth } from '@/contexts/AuthContext'

interface Message {
  text: string;
  from: 'user' | 'bot';
  timestamp: Date;
  sources?: string[];
}

export default function AdminChatPage() {
  const router = useRouter()
  const { user, token, logout } = useAuth()
  
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [strictMode, setStrictMode] = useState(true)
  const [documentStats, setDocumentStats] = useState<{ count: number }>({ count: 0 })

  useEffect(() => {
    const loadDocumentStats = async () => {
      if (!token) return;
      try {
        const resp = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002'}/api/documents/stats`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        if (!resp.ok) return;
        const data = await resp.json();
        const count = typeof data?.totalDocuments === 'number' ? data.totalDocuments : (typeof data?.count === 'number' ? data.count : 0);
        setDocumentStats({ count });
      } catch (_) {}
    };
    loadDocumentStats();
  }, [token]);

  // Show loading while checking authentication
  if (!user || !token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      text: input.trim(),
      from: 'user',
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // TODO: Connect to actual backend API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: userMessage.text,
          userId: user.orgId,
          useRAG: strictMode,
        })
      })

      const data = await response.json()
      
      const botMessage: Message = {
        text: data.reply || 'Sorry, I could not process your request.',
        from: 'bot',
        timestamp: new Date(),
        sources: data.sources,
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        text: 'Sorry, there was an error connecting to the server. Please try again.',
        from: 'bot',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  const toggleStrictMode = () => {
    setStrictMode(!strictMode)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    window.location.href = '/admin/login'
  }

  return (
    <>
      <AdminHeader 
        user={user}
        documentStats={documentStats}
        onLogout={handleLogout}
      />
      <AdminChatInterface
        messages={messages}
        input={input}
        isLoading={isLoading}
        strictMode={strictMode}
        onInputChange={setInput}
        onSendMessage={sendMessage}
        onClearChat={clearChat}
        onToggleStrictMode={toggleStrictMode}
      />
    </>
  )
}

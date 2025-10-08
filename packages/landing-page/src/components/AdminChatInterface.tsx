'use client'

import { useState, useRef, useEffect } from 'react'
import { PaperAirplaneIcon, TrashIcon } from '@heroicons/react/24/outline'

interface Message {
  text: string;
  from: 'user' | 'bot';
  timestamp: Date;
  sources?: string[];
}

interface AdminChatInterfaceProps {
  messages: Message[];
  input: string;
  isLoading: boolean;
  strictMode: boolean;
  onInputChange: (text: string) => void;
  onSendMessage: () => void;
  onClearChat: () => void;
  onToggleStrictMode: () => void;
}

export default function AdminChatInterface({
  messages,
  input,
  isLoading,
  strictMode,
  onInputChange,
  onSendMessage,
  onClearChat,
  onToggleStrictMode,
}: AdminChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-600 to-purple-700">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 min-h-[500px]">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div key={index} className="flex flex-col">
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.from === 'user'
                        ? 'bg-indigo-600 text-white ml-auto'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p className={`text-xs mt-1 ${
                      message.from === 'user' ? 'text-indigo-200' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  
                  {/* Sources */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-2 ml-4 max-w-xs lg:max-w-md">
                      <div className="bg-gray-100 rounded-lg p-3">
                        <p className="text-xs font-semibold text-gray-600 mb-1">Sources:</p>
                        <div className="space-y-1">
                          {message.sources.map((source, idx) => (
                            <p key={idx} className="text-xs text-gray-600">• {source}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex items-center space-x-2 text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                  <span className="text-sm">AI is thinking...</span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      </div>

      {/* Chat Controls */}
      <div className="bg-gray-50 border-t border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <p className="text-sm text-gray-600">
                {strictMode ? '🔒 Strict Mode: Only knowledge base' : '🌐 General Mode: AI + knowledge base'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onClearChat}
                disabled={messages.length === 0}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  messages.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                <TrashIcon className="h-3 w-3 inline mr-1" />
                CLEAR CHAT
              </button>
              
              <button
                onClick={onToggleStrictMode}
                className={`px-3 py-1 rounded-full text-xs font-semibold text-white transition-colors ${
                  strictMode ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500 hover:bg-gray-600'
                }`}
              >
                {strictMode ? 'STRICT' : 'GENERAL'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && onSendMessage()}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={onSendMessage}
              disabled={!input.trim() || isLoading}
              className={`p-3 rounded-lg transition-colors ${
                input.trim() && !isLoading
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState, useCallback } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

interface Message {
  text: string;
  from: 'user' | 'bot';
  timestamp: Date;
  sources?: string[];
}

export const useChat = (token: string | null, userId: string | undefined) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [strictMode, setStrictMode] = useState<boolean>(true);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      text: input.trim(),
      from: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post(API_ENDPOINTS.CHAT, {
        message: userMessage.text,
        userId: userId || 'web-user',
        useRAG: strictMode,
      }, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Authorization': `Bearer ${token}`
        }
      });

      const botMessage: Message = {
        text: response.data.reply,
        from: 'bot',
        timestamp: new Date(),
        sources: response.data.sources,
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        text: 'Sorry, there was an error connecting to the server. Please try again.',
        from: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, token, userId, strictMode]);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    // State
    messages,
    input,
    isLoading,
    strictMode,

    // Actions
    setInput,
    setStrictMode,
    sendMessage,
    clearChat,
  };
};

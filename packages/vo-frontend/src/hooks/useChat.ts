import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  text: string;
  from: 'user' | 'bot';
  timestamp: Date;
  sources?: string[];
}

export const useChat = (token: string | null, userId: string | undefined) => {
  const { token: authToken, user } = useAuth();
  
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
          'Authorization': `Bearer ${authToken}`
        }
      });

      // Check if this is a "no relevant documents" response in strict mode
      const responseText = response.data.reply || response.data.message;
      const isNoResponseFromTrainingData = strictMode && 
        responseText && 
        (responseText.includes("don't have information about that in my knowledge base") ||
         responseText.includes("don't have enough information in my knowledge base"));

      const botMessage: Message = {
        text: isNoResponseFromTrainingData 
          ? "There is no appropriate reply to your message based on the training data. Please try again, add documents to the knowledge base if you are an administrator, or switch to General mode (if available) to utilize my pre-training data to respond to your message."
          : responseText,
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
  }, [input, isLoading, authToken, userId, strictMode]);

  // Clear chat messages when user's current organization changes
  useEffect(() => {
    if (user?.orgId) {
      setMessages([]);
    }
  }, [user?.orgId]);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  const resetChatData = useCallback(() => {
    setMessages([]);
    setInput('');
    setIsLoading(false);
    setStrictMode(true);
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
    resetChatData,
  };
};

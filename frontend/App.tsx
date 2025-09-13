import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import axios from 'axios';

interface Message {
  text: string;
  from: 'user' | 'bot';
  timestamp: Date;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const sendMessage = async () => {
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
      const response = await axios.post('http://localhost:3002/api/chat', {
        message: userMessage.text,
        userId: 'web-user',
      });

      const botMessage: Message = {
        text: response.data.reply,
        from: 'bot',
        timestamp: new Date(),
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
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      {/* Header */}
      <View style={{ backgroundColor: '#3B82F6', padding: 16 }}>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>
          AI Chatbot
        </Text>
      </View>

      {/* Messages */}
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {messages.map((message, index) => (
          <View
            key={index}
            style={{
              maxWidth: 280,
              marginVertical: 8,
              padding: 12,
              borderRadius: 8,
              backgroundColor: message.from === 'user' ? '#3B82F6' : '#E5E7EB',
              alignSelf: message.from === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <Text style={{ color: message.from === 'user' ? 'white' : 'black', fontSize: 14 }}>
              {message.text}
            </Text>
            <Text style={{ 
              color: message.from === 'user' ? '#DBEAFE' : '#6B7280',
              fontSize: 12,
              marginTop: 4
            }}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        ))}
        {isLoading && (
          <View style={{ padding: 12, alignSelf: 'flex-start' }}>
            <Text style={{ color: '#6B7280' }}>AI is thinking...</Text>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 16, 
        borderTopWidth: 1, 
        borderTopColor: '#E5E7EB' 
      }}>
        <TextInput
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: '#D1D5DB',
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 8,
            marginRight: 8,
          }}
          placeholder="Type your message..."
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendMessage}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={{
            padding: 12,
            borderRadius: 8,
            backgroundColor: input.trim() && !isLoading ? '#3B82F6' : '#D1D5DB',
          }}
          onPress={sendMessage}
          disabled={!input.trim() || isLoading}
        >
          <Text style={{ color: input.trim() && !isLoading ? 'white' : 'gray', fontWeight: 'bold' }}>
            Send
          </Text>
        </TouchableOpacity>
      </View>
      
      <StatusBar style="auto" />
    </View>
  );
}

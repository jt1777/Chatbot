import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';

interface Message {
  text: string;
  from: 'user' | 'bot';
  timestamp: Date;
  sources?: string[];
}

interface ChatInterfaceProps {
  messages: Message[];
  input: string;
  isLoading: boolean;
  strictMode: boolean;
  onInputChange: (text: string) => void;
  onSendMessage: () => void;
  onClearChat: () => void;
  onToggleStrictMode: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  input,
  isLoading,
  strictMode,
  onInputChange,
  onSendMessage,
  onClearChat,
  onToggleStrictMode,
}) => {
  return (
    <>
      {/* Messages */}
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {messages.map((message, index) => (
          <View key={index}>
            <View
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
            {/* Sources */}
            {message.sources && message.sources.length > 0 && (
              <View style={{ 
                marginLeft: 8, 
                marginTop: 4, 
                padding: 8, 
                backgroundColor: '#F3F4F6', 
                borderRadius: 4,
                alignSelf: 'flex-start',
                maxWidth: 280
              }}>
                <Text style={{ fontSize: 10, color: '#6B7280', fontWeight: 'bold' }}>Sources:</Text>
                {message.sources.map((source, idx) => (
                  <Text key={idx} style={{ fontSize: 10, color: '#6B7280' }}>• {source}</Text>
                ))}
              </View>
            )}
          </View>
        ))}
        {isLoading && (
          <View style={{ padding: 12, alignSelf: 'flex-start' }}>
            <Text style={{ color: '#6B7280' }}>AI is thinking...</Text>
          </View>
        )}
      </ScrollView>

      {/* Chat Controls */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 16, 
        paddingVertical: 8, 
        backgroundColor: '#F9FAFB',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB'
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, color: '#6B7280' }}>
            {strictMode ? '🔒 Strict Mode: Only knowledge base' : '🌐 General Mode: AI + knowledge base'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={onClearChat}
            style={{
              backgroundColor: messages.length === 0 ? '#D1D5DB' : '#EF4444',
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 4,
              marginRight: 8,
              opacity: messages.length === 0 ? 0.5 : 1,
              pointerEvents: messages.length === 0 ? 'none' : 'auto'
            }}
            disabled={messages.length === 0}
          >
            <Text style={{ 
              color: messages.length === 0 ? '#6B7280' : 'white', 
              fontSize: 12, 
              fontWeight: '600' 
            }}>
              CLEAR CHAT
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onToggleStrictMode}
            style={{
              backgroundColor: strictMode ? '#10B981' : '#6B7280',
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 4
            }}
          >
            <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
              {strictMode ? 'STRICT' : 'GENERAL'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Input Area */}
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
          onChangeText={onInputChange}
          onSubmitEditing={onSendMessage}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={{
            padding: 12,
            borderRadius: 8,
            backgroundColor: input.trim() && !isLoading ? '#3B82F6' : '#D1D5DB',
            pointerEvents: (!input.trim() || isLoading) ? 'none' : 'auto'
          }}
          onPress={onSendMessage}
          disabled={!input.trim() || isLoading}
        >
          <Text style={{ color: input.trim() && !isLoading ? 'white' : 'gray', fontWeight: 'bold' }}>
            Send
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

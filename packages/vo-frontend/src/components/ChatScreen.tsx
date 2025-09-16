import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

interface Message {
  text: string;
  from: 'user' | 'bot';
  timestamp?: Date;
}

const ChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = async () => {
    if (!input.trim()) return;

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
        userId: 'mobile-user', // For conversation persistence
      });

      const botMessage: Message = {
        text: response.data.reply,
        from: 'bot',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      Alert.alert('Error', 'Failed to send message. Please try again.');
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToEnd = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  useEffect(() => {
    scrollToEnd();
  }, [messages]);

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={{
        maxWidth: 280,
        marginHorizontal: 16,
        marginVertical: 8,
        padding: 12,
        borderRadius: 8,
        backgroundColor: item.from === 'user' ? '#3B82F6' : '#E5E7EB',
        alignSelf: item.from === 'user' ? 'flex-end' : 'flex-start',
      }}
    >
      <Text
        style={{
          fontSize: 14,
          color: item.from === 'user' ? 'white' : 'black',
        }}
      >
        {item.text}
      </Text>
      {item.timestamp && (
        <Text
          style={{
            fontSize: 12,
            marginTop: 4,
            color: item.from === 'user' ? '#DBEAFE' : '#6B7280',
          }}
        >
          {item.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1 }}>
          <View style={{ backgroundColor: '#3B82F6', padding: 16 }}>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>
              AI Chatbot
            </Text>
          </View>

          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item, index) => index.toString()}
            style={{ flex: 1, padding: 8 }}
            onContentSizeChange={scrollToEnd}
            onLayout={scrollToEnd}
          />

          {isLoading && (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
              <ActivityIndicator size="small" color="#3B82F6" />
              <Text style={{ marginLeft: 8, color: '#6B7280' }}>AI is thinking...</Text>
            </View>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
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
                padding: 8,
                borderRadius: 8,
                backgroundColor: input.trim() && !isLoading ? '#3B82F6' : '#D1D5DB',
              }}
              onPress={sendMessage}
              disabled={!input.trim() || isLoading}
            >
              <Ionicons
                name="send"
                size={20}
                color={input.trim() && !isLoading ? 'white' : 'gray'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;

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
      const response = await axios.post('http://localhost:5000/api/chat', {
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
      className={`max-w-xs mx-4 my-2 p-3 rounded-lg ${
        item.from === 'user'
          ? 'bg-blue-500 self-end ml-auto'
          : 'bg-gray-200 self-start mr-auto'
      }`}
    >
      <Text
        className={`text-sm ${
          item.from === 'user' ? 'text-white' : 'text-black'
        }`}
      >
        {item.text}
      </Text>
      {item.timestamp && (
        <Text
          className={`text-xs mt-1 ${
            item.from === 'user' ? 'text-blue-100' : 'text-gray-500'
          }`}
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
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1">
          <View className="bg-blue-500 p-4">
            <Text className="text-white text-lg font-bold text-center">
              AI Chatbot
            </Text>
          </View>

          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item, index) => index.toString()}
            className="flex-1 p-2"
            onContentSizeChange={scrollToEnd}
            onLayout={scrollToEnd}
          />

          {isLoading && (
            <View className="flex-row items-center justify-center p-2">
              <ActivityIndicator size="small" color="#3B82F6" />
              <Text className="ml-2 text-gray-500">AI is thinking...</Text>
            </View>
          )}

          <View className="flex-row items-center p-4 border-t border-gray-200">
            <TextInput
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 mr-2"
              placeholder="Type your message..."
              value={input}
              onChangeText={setInput}
              onSubmitEditing={sendMessage}
              editable={!isLoading}
            />
            <TouchableOpacity
              className={`p-2 rounded-lg ${
                input.trim() && !isLoading
                  ? 'bg-blue-500'
                  : 'bg-gray-300'
              }`}
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

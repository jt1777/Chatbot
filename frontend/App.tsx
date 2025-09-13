import { StatusBar } from 'expo-status-bar';
import './global.css';
import ChatScreen from './src/components/ChatScreen';

export default function App() {
  return (
    <>
      <ChatScreen />
      <StatusBar style="auto" />
    </>
  );
}

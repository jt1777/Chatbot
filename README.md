# AI Chatbot Mobile App with RAG Implementation

This is a React Native chatbot mobile app built with Expo and TypeScript, featuring a Node.js backend with HuggingFace LLM integration for conversational AI.

## Features

- **React Native Frontend**: Built with Expo and TypeScript
- **Chat Interface**: Clean, modern chat UI with message bubbles
- **HuggingFace Integration**: Uses Microsoft's DialoGPT-medium for conversational AI
- **Conversation History**: Maintains context across messages
- **Real-time Responses**: Streaming chat experience with loading indicators
- **Error Handling**: Robust error handling and user feedback
- **NativeWind Styling**: Tailwind CSS for React Native

## Project Structure

```
chatbot/
├── frontend/          # React Native app (Expo)
│   ├── src/
│   │   └── components/
│   │       └── ChatScreen.tsx
│   ├── App.tsx
│   ├── package.json
│   └── ...
└── backend/           # Node.js server
    ├── src/
    │   └── server.ts
    ├── package.json
    ├── tsconfig.json
    └── .env
```

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI: `npm install -g @expo/cli`
- A HuggingFace account with an API key

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your HuggingFace API key:
   - Go to [HuggingFace](https://huggingface.co/settings/tokens)
   - Create a new token with "Read" permissions
   - Copy the token

4. Update the `.env` file:
   ```
   HUGGINGFACE_API_KEY=your-actual-huggingface-api-key-here
   PORT=5000
   ```

5. Start the backend server:
   ```bash
   npx ts-node src/server.ts
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Expo development server:
   ```bash
   npm start
   ```

4. Run on device/emulator:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your phone

## API Endpoints

### POST /api/chat
Send a message to the chatbot.

**Request Body:**
```json
{
  "message": "Hello, how are you?",
  "userId": "optional-user-identifier"
}
```

**Response:**
```json
{
  "reply": "I'm doing well, thank you for asking!"
}
```

## Key Technologies

- **Frontend**: React Native, Expo, TypeScript, NativeWind, Axios
- **Backend**: Node.js, Express, TypeScript
- **AI**: HuggingFace Inference API, LangChain.js
- **Styling**: Tailwind CSS (via NativeWind)

## RAG Implementation Notes

This basic implementation includes conversational memory but doesn't yet include full RAG (Retrieval-Augmented Generation). For RAG implementation, you would need to:

1. Add a vector database (like Pinecone, Weaviate, or Chroma)
2. Implement document ingestion and embedding
3. Add retrieval logic to fetch relevant context
4. Integrate retrieved context into the LLM prompts

The conversation history feature provides basic context retention within each chat session.

## Development Notes

- The backend uses in-memory storage for conversation history (resets on server restart)
- For production, consider using Redis or a database for persistent conversation storage
- The HuggingFace model (DialoGPT-medium) is optimized for conversational AI
- Error handling includes both client and server-side validation

## Troubleshooting

- **Backend won't start**: Check that your HuggingFace API key is valid and properly set in `.env`
- **Frontend won't compile**: Ensure all dependencies are installed and NativeWind is properly configured
- **Network errors**: Make sure the backend is running on port 5000 and the frontend is configured to connect to `http://localhost:5000`

## Next Steps for RAG Implementation

To implement full RAG capabilities:

1. Choose a vector database
2. Add document ingestion pipeline
3. Implement embedding generation
4. Create retrieval mechanisms
5. Integrate retrieved context into LLM prompts
6. Add document management features

Let me know if you need help implementing any of these features!

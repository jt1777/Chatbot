import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { HuggingFaceInference } from '@langchain/community/llms/hf';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize HuggingFace LLM
if (!process.env.HUGGINGFACE_API_KEY) {
  throw new Error('HUGGINGFACE_API_KEY environment variable is required');
}

const llm = new HuggingFaceInference({
  apiKey: process.env.HUGGINGFACE_API_KEY,
  model: 'microsoft/DialoGPT-medium', // Good conversational model
  temperature: 0.7,
  maxTokens: 100,
});

// In-memory conversation history storage (for demo purposes)
const conversationHistory = new Map<string, string[]>();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend running');
});

app.post('/api/chat', async (req, res) => {
  const { message, userId = 'default' } = req.body as { message: string; userId?: string };

  try {
    // Get or create conversation history for this user
    const history = conversationHistory.get(userId) || [];
    history.push(`User: ${message}`);

    // Create context from recent conversation (limit to last 10 exchanges for token limits)
    const context = history.slice(-10).join('\n');
    const fullPrompt = context + '\nBot:';

    const response = await llm.call(fullPrompt);

    // Store bot response in history
    history.push(`Bot: ${response}`);
    conversationHistory.set(userId, history);

    res.json({ reply: response });
  } catch (error) {
    console.error('LLM error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

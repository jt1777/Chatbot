#!/bin/bash

# Start VO (Organizational Version) - Backend and Frontend
echo "🚀 Starting Chatbot VO..."

# Start backend in background
echo "📡 Starting backend server..."
cd packages/vo-backend && npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "📱 Starting frontend..."
cd ../vo-frontend && npm start

# Cleanup function
cleanup() {
    echo "🛑 Shutting down..."
    kill $BACKEND_PID 2>/dev/null
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT SIGTERM

# Wait for background process
wait $BACKEND_PID

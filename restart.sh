#!/bin/bash

# Kill any existing server on port 3002
echo "🔍 Checking for existing processes on port 3002..."
PID=$(lsof -ti :3002)

if [ ! -z "$PID" ]; then
    echo "🚫 Killing process $PID on port 3002"
    kill -9 $PID
    sleep 1
fi

echo "🚀 Starting server..."
npm run dev

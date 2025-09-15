#!/bin/bash

# Frontend startup script

echo "Starting Billder Frontend..."

# Check if we're in development or production mode
if [ "$NODE_ENV" = "development" ]; then
    echo "Running in development mode with hot reloading..."
    npm run dev
else
    echo "Running in production mode..."
    npm run build
    npm run start
fi

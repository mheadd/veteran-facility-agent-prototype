#!/bin/bash

# Veteran Facility Agent Setup Script
echo "🇺🇸 Setting up Veteran Facility Agent..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📄 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your API keys before proceeding"
    echo "   Required: OPENWEATHERMAP_API_KEY, GOOGLE_MAPS_API_KEY"
    echo "   Optional: WEATHERAPI_KEY, MAPBOX_API_KEY, GOOGLE_DIRECTIONS_API_KEY"
    echo ""
    read -p "Press Enter when you've configured your API keys..."
fi

# Create data directory
echo "📁 Creating data directories..."
mkdir -p data logs

# Build and start containers
echo "🐳 Building and starting containers..."
docker-compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check if Ollama is running
echo "🤖 Checking Ollama service..."
if ! docker-compose exec ollama ollama --version &> /dev/null; then
    echo "❌ Ollama service is not running properly"
    exit 1
fi

# Pull the default model
echo "📥 Pulling default LLM model (this may take a while)..."
docker-compose exec ollama ollama pull llama3.1:8b

# Initialize the database
echo "🗄️ Initializing database..."
docker-compose exec app npm run init-db

# Run health check
echo "🏥 Running health check..."
sleep 10
HEALTH_CHECK=$(curl -s http://localhost:3000/api/health)
if echo "$HEALTH_CHECK" | grep -q "healthy"; then
    echo "✅ Health check passed!"
else
    echo "❌ Health check failed. Check logs with: docker-compose logs app"
    exit 1
fi

# Test the main endpoint
echo "🧪 Testing main functionality..."
TEST_RESPONSE=$(curl -s -X POST http://localhost:3000/api/facilities/find \
  -H "Content-Type: application/json" \
  -d '{"address": "1600 Pennsylvania Avenue NW, Washington, DC 20500"}')

if echo "$TEST_RESPONSE" | grep -q "error"; then
    echo "⚠️  Test completed with errors. This may be normal if APIs are not configured."
else
    echo "✅ Basic functionality test passed!"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "🚀 Your Veteran Facility Agent is running at:"
echo "   API: http://localhost:3000"
echo "   Health: http://localhost:3000/api/health"
echo ""
echo "📋 Useful commands:"
echo "   View logs: docker-compose logs -f app"
echo "   Stop services: docker-compose down"
echo "   Restart services: docker-compose restart"
echo "   View Ollama models: docker-compose exec ollama ollama list"
echo ""
echo "📖 Check the README.md for API documentation and usage examples."
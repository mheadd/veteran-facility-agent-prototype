#!/bin/bash

# MacBook Air M2 Optimized Setup Script for Veteran Facility Agent
echo "🍎 Setting up Veteran Facility Agent for MacBook Air M2..."

# Check system requirements
echo "🔍 Checking system requirements..."
TOTAL_RAM=$(sysctl hw.memsize | awk '{print $2/1024/1024/1024}')
echo "   Available RAM: ${TOTAL_RAM}GB"

if (( $(echo "$TOTAL_RAM < 8" | bc -l) )); then
    echo "❌ Insufficient RAM. At least 8GB required."
    exit 1
fi

# Check if we're on Apple Silicon
ARCH=$(uname -m)
if [ "$ARCH" != "arm64" ]; then
    echo "⚠️  Warning: This script is optimized for Apple Silicon (M1/M2/M3)"
fi

# Check Docker installation
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed."
    echo "   Install Docker Desktop for Mac from: https://docker.com/products/docker-desktop"
    exit 1
fi

# Check Docker resource allocation
echo "🐳 Checking Docker resource allocation..."
DOCKER_MEMORY=$(docker system info --format '{{.MemTotal}}' 2>/dev/null | awk '{print $1/1024/1024/1024}')
if (( $(echo "$DOCKER_MEMORY < 8" | bc -l) )); then
    echo "⚠️  Docker has limited memory allocation ($DOCKER_MEMORY GB)"
    echo "   Recommended: Increase Docker memory to 10-12GB in Docker Desktop preferences"
fi

# Create optimized directory structure
echo "📁 Creating optimized data directories..."
mkdir -p data/{redis,ollama,logs}
mkdir -p logs

# Create .env file with M2-optimized settings
if [ ! -f .env ]; then
    echo "📄 Creating M2-optimized .env file..."
    cp .env.example .env
    
    # Add M2-specific optimizations
    cat >> .env << EOF

# M2 MacBook Air Optimizations
NODE_OPTIONS=--max-old-space-size=1536 --optimize-for-size
OLLAMA_NUM_PARALLEL=1
OLLAMA_MAX_LOADED_MODELS=1
DEFAULT_MODEL=phi3:mini
REDIS_MAXMEMORY=256mb
LOG_LEVEL=info

# Memory-efficient caching
WEATHER_CACHE_DURATION=1800
FACILITY_CACHE_DURATION=7200
EOF

    echo "⚠️  Please edit .env file with your API keys before proceeding"
    echo "   Required: OPENWEATHERMAP_API_KEY"
    echo "   Recommended: GOOGLE_MAPS_API_KEY"
    echo ""
    read -p "Press Enter when you've configured your API keys..."
fi

# Pre-pull ARM64 optimized images
echo "📥 Pre-pulling ARM64 optimized Docker images..."
docker pull --platform linux/arm64 node:18-alpine
docker pull --platform linux/arm64 redis:7-alpine
docker pull --platform linux/arm64 ollama/ollama:latest

# Build and start containers with resource constraints
echo "🚀 Building and starting containers..."
export DOCKER_DEFAULT_PLATFORM=linux/arm64
docker-compose up -d --build

# Wait for services with longer timeouts for M2
echo "⏳ Waiting for services to initialize..."
sleep 45

# Check if Ollama is running
echo "🤖 Checking Ollama service..."
timeout 60 bash -c 'until docker-compose exec ollama ollama --version 2>/dev/null; do sleep 2; done'
if [ $? -ne 0 ]; then
    echo "❌ Ollama service failed to start properly"
    echo "   Check logs: docker-compose logs ollama"
    exit 1
fi

# Pull optimized model for M2
echo "🧠 Pulling optimized LLM model for M2..."
echo "   Using phi3:mini (fastest performance, ~2.2GB)"
docker-compose exec ollama ollama pull phi3:mini

# Optional: Pull larger model for production use
read -p "🔄 Also pull llama3.1:8b for production use? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📥 Pulling llama3.1:8b (this will take longer, ~5GB)..."
    docker-compose exec ollama ollama pull llama3.1:8b
fi

# Initialize database
echo "🗄️ Initializing database..."
docker-compose exec app npm run init-db

# Run comprehensive health check
echo "🏥 Running health checks..."
sleep 15

# Check app health
APP_HEALTH=$(curl -s -w "%{http_code}" http://localhost:3000/api/health -o /dev/null)
if [ "$APP_HEALTH" != "200" ]; then
    echo "❌ App health check failed (HTTP $APP_HEALTH)"
    echo "   Check logs: docker-compose logs app"
    exit 1
fi

# Check Ollama health
OLLAMA_HEALTH=$(curl -s -w "%{http_code}" http://localhost:11434/api/tags -o /dev/null)
if [ "$OLLAMA_HEALTH" != "200" ]; then
    echo "❌ Ollama health check failed (HTTP $OLLAMA_HEALTH)"
    echo "   Check logs: docker-compose logs ollama"
    exit 1
fi

# Check Redis health
REDIS_HEALTH=$(docker-compose exec redis redis-cli ping 2>/dev/null)
if [ "$REDIS_HEALTH" != "PONG" ]; then
    echo "❌ Redis health check failed"
    echo "   Check logs: docker-compose logs redis"
    exit 1
fi

echo "✅ All health checks passed!"

# Test core functionality
echo "🧪 Testing core functionality..."
TEST_RESPONSE=$(curl -s -X POST http://localhost:3000/api/facilities/find \
  -H "Content-Type: application/json" \
  -d '{"address": "1600 Pennsylvania Avenue NW, Washington, DC 20500"}' \
  --max-time 30)

if echo "$TEST_RESPONSE" | grep -q "error.*API key"; then
    echo "⚠️  Test shows API key issues (expected if not configured)"
elif echo "$TEST_RESPONSE" | grep -q "error"; then
    echo "⚠️  Test completed with errors - check configuration"
else
    echo "✅ Core functionality test passed!"
fi

# Display system resource usage
echo ""
echo "📊 Current resource usage:"
echo "   Docker containers:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

echo ""
echo "🎉 M2 MacBook Air setup complete!"
echo ""
echo "🚀 Your Veteran Facility Agent is running at:"
echo "   API: http://localhost:3000"
echo "   Health: http://localhost:3000/api/health"
echo "   Ollama: http://localhost:11434"
echo ""
echo "🧠 Available models:"
docker-compose exec ollama ollama list

echo ""
echo "📋 M2-optimized commands:"
echo "   Switch to lightweight model: docker-compose exec ollama ollama run llama3.1:3b"
echo "   Switch to full model: docker-compose exec ollama ollama run llama3.1:8b"
echo "   Monitor resources: docker stats"
echo "   View logs: docker-compose logs -f app"
echo "   Stop services: docker-compose down"
echo ""
echo "💡 Tips for M2 MacBook Air:"
echo "   - Start with 3b model for development"
echo "   - Use 8b model for production testing"
echo "   - Monitor memory usage with 'docker stats'"
echo "   - Close other memory-intensive apps during heavy usage"
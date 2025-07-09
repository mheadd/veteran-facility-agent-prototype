#!/bin/bash

# Model Management Script for M2 MacBook Air
# scripts/manage-models.sh

show_usage() {
    echo "Model Management for M2 MacBook Air"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  list                 Show available models"
    echo "  switch <model>       Switch to a different model"
    echo "  pull <model>         Download a new model"
    echo "  remove <model>       Remove a model to free space"
    echo "  status              Show current model and resource usage"
    echo "  optimize            Optimize for current memory usage"
    echo ""
    echo "Recommended models for M2 MacBook Air (16GB):"
    echo "  phi3:mini           ~2GB RAM - **Recommended default** (fastest)"
    echo "  llama3.1:3b        ~2GB RAM - Alternative lightweight option"
    echo "  llama3.1:8b        ~5GB RAM - Higher quality (slower)"
    echo "  mistral:7b          ~4GB RAM - Alternative option"
}

list_models() {
    echo "📋 Available models:"
    docker-compose exec ollama ollama list
    echo ""
    echo "💾 Model storage usage:"
    docker-compose exec ollama du -sh /root/.ollama/models 2>/dev/null || echo "Unable to check storage"
}

switch_model() {
    local model=$1
    if [ -z "$model" ]; then
        echo "❌ Please specify a model name"
        echo "Example: $0 switch llama3.1:3b"
        return 1
    fi
    
    echo "🔄 Switching to model: $model"
    
    # Update environment variable
    if grep -q "DEFAULT_MODEL=" .env; then
        sed -i.bak "s/DEFAULT_MODEL=.*/DEFAULT_MODEL=$model/" .env
    else
        echo "DEFAULT_MODEL=$model" >> .env
    fi
    
    # Test the model
    echo "🧪 Testing model..."
    docker-compose exec ollama ollama run $model "Hello, this is a test." --verbose
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully switched to $model"
        echo "🔄 Restart the app container to use the new model:"
        echo "   docker-compose restart app"
    else
        echo "❌ Failed to switch to $model"
        echo "💡 Try pulling the model first: $0 pull $model"
    fi
}

pull_model() {
    local model=$1
    if [ -z "$model" ]; then
        echo "❌ Please specify a model name"
        echo "Example: $0 pull llama3.1:8b"
        return 1
    fi
    
    # Check available space
    echo "💾 Checking available space..."
    available_space=$(df -h . | awk 'NR==2 {print $4}')
    echo "Available space: $available_space"
    
    echo "📥 Pulling model: $model"
    echo "⏳ This may take several minutes..."
    
    docker-compose exec ollama ollama pull $model
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully pulled $model"
        list_models
    else
        echo "❌ Failed to pull $model"
    fi
}

remove_model() {
    local model=$1
    if [ -z "$model" ]; then
        echo "❌ Please specify a model name"
        echo "Example: $0 remove llama3.1:8b"
        return 1
    fi
    
    echo "🗑️  Removing model: $model"
    read -p "Are you sure? This cannot be undone. (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose exec ollama ollama rm $model
        if [ $? -eq 0 ]; then
            echo "✅ Successfully removed $model"
        else
            echo "❌ Failed to remove $model"
        fi
    else
        echo "🚫 Cancelled"
    fi
}

show_status() {
    echo "📊 System Status"
    echo "================"
    
    # Current model
    current_model=$(grep "DEFAULT_MODEL=" .env | cut -d'=' -f2)
    echo "Current model: $current_model"
    echo ""
    
    # Container resource usage
    echo "💻 Container Resource Usage:"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
    echo ""
    
    # Available models
    echo "📋 Installed Models:"
    docker-compose exec ollama ollama list
    echo ""
    
    # System memory
    echo "🖥️  System Memory:"
    total_ram=$(sysctl hw.memsize | awk '{print $2/1024/1024/1024}')
    echo "Total RAM: ${total_ram}GB"
    
    # Docker memory allocation
    docker_memory=$(docker system info --format '{{.MemTotal}}' 2>/dev/null | awk '{print $1/1024/1024/1024}')
    echo "Docker allocated: ${docker_memory}GB"
}

optimize_for_memory() {
    echo "🔧 Optimizing for current memory usage..."
    
    # Get current memory usage
    total_ram=$(sysctl hw.memsize | awk '{print $2/1024/1024/1024}')
    available_ram=$(vm_stat | awk '/Pages free/ {print $3}' | tr -d '.' | awk '{print $1*4096/1024/1024/1024}')
    
    echo "Total RAM: ${total_ram}GB"
    echo "Available RAM: ~${available_ram}GB"
    
    # Recommend model based on available memory
    if (( $(echo "$available_ram > 8" | bc -l) )); then
        recommended="llama3.1:8b"
        echo "✅ Sufficient memory for full model"
    elif (( $(echo "$available_ram > 4" | bc -l) )); then
        recommended="mistral:7b"
        echo "⚠️  Moderate memory - recommend medium model"
    else
        recommended="llama3.1:3b"
        echo "⚠️  Limited memory - recommend lightweight model"
    fi
    
    echo "💡 Recommended model: $recommended"
    echo ""
    read -p "Switch to recommended model? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        switch_model $recommended
    fi
}

# Main script logic
case "${1:-}" in
    "list")
        list_models
        ;;
    "switch")
        switch_model "$2"
        ;;
    "pull")
        pull_model "$2"
        ;;
    "remove")
        remove_model "$2"
        ;;
    "status")
        show_status
        ;;
    "optimize")
        optimize_for_memory
        ;;
    *)
        show_usage
        ;;
esac
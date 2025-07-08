[![CI/CD Pipeline](https://github.com/mheadd/veteran-facility-agent-prototype/actions/workflows/ci.yml/badge.svg)](https://github.com/mheadd/veteran-facility-agent-prototype/actions/workflows/ci.yml)

# Veteran Facility Agent Prototype

A fully functional AI-powered agent that helps veterans find nearby VA facilities and get intelligent transportation recommendations. Built from the ground up using Node.js, local LLM processing, and real-time API integrations, this system provides veterans with comprehensive facility information, services available, and weather-aware travel guidance—all while maintaining complete data privacy through local processing.

**What makes this special:** Unlike cloud-based solutions, this agent runs entirely on your local machine (optimized for MacBook Air M2 and similar hardware), ensuring veteran data never leaves your computer while still providing sophisticated AI-powered recommendations. The system integrates real VA facility data, Google Maps geocoding, weather analysis, and local LLM reasoning to deliver personalized guidance for veteran facility visits.

A self-contained AI agent application designed to help veterans find nearby VA facilities and get weather-aware transportation recommendations. **Optimized to run efficiently on conventional laptops** with local processing and smart resource management.

## Table of Contents

- [Overview](#overview)
- [Core Functionality](#core-functionality)
- [Design Considerations](#design-considerations)
- [Technology Stack](#technology-stack)
- [Installation and Setup](#installation-and-setup)
- [API Endpoints](#api-endpoints)
- [Configuration System](#configuration-system)
- [Testing](#testing)
- [Resource Management and Optimization](#resource-management-and-optimization)
- [Contributing](#contributing)
- [Privacy and Security](#privacy-and-security)
- [Hardware Compatibility](#hardware-compatibility)
- [Support](#support)

## Overview

This application takes an address or coordinates as input and provides veterans with:
- The nearest VA facility based on their location
- Multiple transportation options to reach the facility
- Weather-aware recommendations that adjust based on current and forecasted conditions
- Backup transportation suggestions during inclement weather

The agent is built with privacy and independence in mind, using local LLM processing and containerized deployment to ensure veteran data remains secure and the system operates without external dependencies. **The solution is specifically optimized for resource-constrained environments**, including MacBook Air M2 systems with 16GB RAM, making advanced AI capabilities accessible without requiring specialized hardware or cloud dependencies.

## Core Functionality

### Location Processing
- Accepts addresses or GPS coordinates as input
- Converts addresses to coordinates using geocoding services
- Handles various input formats and validates location data

### VA Facility Discovery
- Queries the VA Veterans Administration Facilities Locator API
- Finds the nearest facility based on distance and services offered
- Filters by facility type (medical centers, clinics, etc.)
- Provides facility details including services, hours, and contact information

### Transportation Intelligence
- Integrates with public transit APIs for route planning
- Provides multiple transportation options with timing and cost estimates
- Generates deep links to rideshare applications when appropriate
- Includes veteran-specific transportation services (VA shuttles, DAV services)

### Weather-Aware Recommendations
- Monitors current weather conditions and forecasts
- Adjusts transportation recommendations based on weather severity
- Prioritizes covered transit options during precipitation
- Accounts for temperature extremes and their impact on travel
- Provides weather-specific travel advisories and timing suggestions

## Design Considerations

### Self-Contained Architecture
- **Containerized Deployment**: Full application stack runs in Docker containers
- **Local LLM Processing**: Uses Ollama for on-premise AI processing with smart resource management
- **Data Privacy**: All veteran data processed locally without external transmission
- **Offline Capability**: Core functionality works without internet connectivity
- **Laptop-Optimized**: Specifically configured for conventional laptops (8-16GB RAM) with intelligent model selection and memory management

### Resource Efficiency and Hardware Compatibility
- **MacBook Air M2 Optimized**: Includes specific configurations for Apple Silicon with 16GB RAM
- **Adaptive Model Selection**: Automatically switches between lightweight (3B) and full-capability (8B) models based on available resources
- **Memory Management**: Smart allocation with Redis caching and SQLite persistence to minimize resource usage
- **ARM64 Native**: Optimized Docker images for Apple Silicon with multi-stage builds for efficiency

### Scalability and Performance
- **Redis Caching**: Fast access to session data and API responses
- **SQLite Persistence**: Lightweight database for user preferences and history
- **Efficient API Usage**: Caches static data (VA facilities) and optimizes external calls
- **Resource Optimization**: Uses quantized models for memory efficiency

### Veteran-Centric Design
- **Accessibility**: Considers mobility limitations in route planning
- **Medical Priority**: Prioritizes reliable transportation for medical appointments
- **Service Integration**: Incorporates VA-specific transportation services
- **Weather Sensitivity**: Extra consideration for weather impacts on veterans with disabilities

## Technology Stack

### Backend Framework
- **Node.js**: Primary development language
- **Express.js**: Web server framework
- **Docker**: Containerization platform
- **Docker Compose**: Multi-container orchestration

### AI and Processing
- **Ollama**: Local LLM hosting platform with resource optimization
- **Adaptive Models**: 
  - **llama3**: Standard model for balanced performance (~5GB RAM)
  - **llama3.1**: If available, enhanced version with improved capabilities
  - **Mistral 7B**: Alternative balanced option (~4GB RAM)
  - **Phi-3**: Microsoft's efficient model for constrained environments (~2GB RAM)
- **Model Management**: Easy switching between models based on current system resources

### Data Storage
- **Redis**: In-memory caching and session management
- **SQLite3**: Persistent data storage
- **Volume Mounting**: Data persistence across container restarts

### External APIs
- **VA Facilities Locator API**: Official VA facility data
- **OpenWeatherMap API**: Weather data and forecasting
- **Geocoding Services**: Address to coordinate conversion
  - Google Maps Geocoding API
  - OpenStreetMap Nominatim
  - MapBox Geocoding API
- **Transit APIs**: Public transportation data
  - Google Maps Directions API
  - Local transit agency APIs
  - GTFS (General Transit Feed Specification) data

### Geospatial and Utility Libraries
- **node-geocoder**: Multiple geocoding service support
- **turf**: Geospatial calculations and distance measurements
- **gtfs**: Transit data processing
- **cheerio**: Web scraping for additional data sources
- **axios**: HTTP client for API requests
- **moment**: Date and time handling for schedules

## Installation and Setup

### System Requirements
- **Minimum**: 8GB RAM, 4 CPU cores, 15GB storage
- **Recommended**: 16GB RAM (MacBook Air M2 or equivalent)
- Docker and Docker Compose installed
- **Optimized for**: macOS Apple Silicon, Linux ARM64/x86_64, Windows WSL2

### Quick Start (Standard Setup)
```bash
# Clone the repository
git clone https://github.com/yourusername/veteran-facility-agent.git
cd veteran-facility-agent

# Generate package-lock.json (required for Docker build)
npm install

# Standard setup
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### MacBook Air M2 Optimized Setup
```bash
# Clone and prepare the repository
git clone https://github.com/yourusername/veteran-facility-agent.git
cd veteran-facility-agent

# Generate package-lock.json (required for Docker build)
npm install

# M2-optimized setup with resource management
chmod +x scripts/setup-m2.sh scripts/manage-models.sh
./scripts/setup-m2.sh

# Manage models for optimal performance
./scripts/manage-models.sh status
./scripts/manage-models.sh optimize  # Auto-select best model for current resources
```

### Manual Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/veteran-facility-agent.git
cd veteran-facility-agent

# Generate package-lock.json (required for Docker build)
npm install

# Create environment file
cp .env.example .env
# Edit .env with your API keys

# Start services
docker-compose up -d

# Initialize database
docker exec app npm run init-db

# Pull appropriate model (choose based on your system)
docker exec ollama ollama pull phi3      # Lightweight (8GB+ RAM systems)
docker exec ollama ollama pull llama3    # Full capability (16GB+ RAM systems)
```

## API Endpoints

### Core Functionality
- `POST /api/facilities/find` - Find nearest VA facility and transportation options
- `POST /api/facilities/simple-ask` - Process veteran queries with AI-powered assistance
- `POST /api/facilities/geocode` - Convert addresses to coordinates (standalone geocoding service)

### Utility and Testing Endpoints
- `GET /api/health` - Application health check
- `GET /api/test` - Basic API status and service availability
- `GET /api/facilities/test-llm` - Test LLM service availability and functionality
- `GET /api/facilities/test-weather` - Test weather service with sample coordinates
- `GET /api/facilities/test-transit` - Test transportation routing between sample locations

### Geocoding Service
The `/api/facilities/geocode` endpoint provides standalone address-to-coordinates conversion:

Some sample API requests and responses can be found [in the documentation](https://github.com/mheadd/veteran-facility-agent-prototype/issues?q=is%3Aissue%20state%3Aopen%20label%3Adocumentation).
   
## Testing

This project includes a comprehensive test suite covering all major functionality including API endpoints, LLM intelligence, VA facility discovery, and error handling.

### Running Tests

```bash
# Run all tests
docker-compose exec app npm test

# Run tests with coverage report
docker-compose exec app npm run test:coverage

# Run tests in watch mode (for development)
docker-compose exec app npm run test:watch

# Run specific test suites
docker-compose exec app npm test -- --testNamePattern="LLM"
docker-compose exec app npm test -- --testNamePattern="Facility"
docker-compose exec app npm test -- --testNamePattern="Error"
```

### Test Coverage

The test suite includes:
- **Health and Basic Functionality**: API health checks and basic endpoints
- **Geocoding Service**: Address conversion and validation
- **VA Facility Discovery**: Real facility data retrieval and processing
- **LLM Intelligence**: AI-powered query processing and recommendations
- **Data Quality**: Facility data structure and distance calculations
- **Recommendations Engine**: Veteran-specific advice generation
- **Error Handling**: Edge cases and malformed request handling

### Test Requirements

- **API Keys**: Some tests require valid API keys in your `.env` file
- **LLM Service**: Ollama must be running for LLM-related tests
- **Network Access**: Tests require internet connectivity for external APIs

### Test Configuration

Test settings are configured in `package.json`:
- **Timeout**: 70 seconds for LLM operations
- **Environment**: Automatically set to test mode
- **Coverage**: Detailed reports generated in `coverage/` directory

Run `npm run test:coverage` to see detailed coverage statistics and identify areas for additional testing.

## Configuration System

The application uses a centralized configuration system located in `src/config/index.js`. All configurable values are organized by service:

- **VA API Service**: Search radius, cache duration, API timeouts
- **LLM Service**: Response timeouts, temperature settings, model presets
- **Weather Service**: Cache duration, request timeouts, temperature thresholds
- **Transit Service**: Request timeouts, rideshare estimates
- **Geocoding Service**: Request timeouts
- **Transportation Analysis**: Distance thresholds, scoring algorithms
- **Search Settings**: Default search radius, result limits

#### Environment-Specific Overrides

The configuration supports environment-specific overrides for development, test, and production environments. To modify configuration values:

1. Edit `src/config/index.js` for permanent changes
2. Use environment-specific overrides for temporary changes
3. Access configuration using `getConfig('path.to.config')` or `getServiceConfig('serviceName')`

## Resource Management and Optimization

### Model Selection Guide
Choose the appropriate model based on your system:

| System RAM | Recommended Model | Usage | Performance |
|------------|------------------|-------|-------------|
| 8-12GB     | `phi3`          | Development, testing | Fast, efficient |
| 12-16GB    | `mistral:7b`    | Balanced performance | Good quality/speed |
| 16GB+      | `llama3`        | Production use | Best quality |

### Performance Optimization Commands
```bash
# Check current resource usage
docker stats

# Optimize model selection for current system
./scripts/manage-models.sh optimize

# Switch models as needed
./scripts/manage-models.sh switch phi3        # Lighter load
./scripts/manage-models.sh switch llama3      # Full capability

# Monitor system resources
./scripts/manage-models.sh status
```

### Expected Performance (MacBook Air M2, 16GB RAM)
- **Simple queries**: 2-5 seconds
- **Complex routing**: 5-10 seconds  
- **Weather analysis**: 3-7 seconds
- **Memory usage**: 6-10GB total (including macOS)
- **Concurrent users**: 5-10 comfortable# Veteran Facility Agent

## Contributing

This project is designed to serve veterans and their families. Contributions that improve accessibility, add new transportation options, or enhance the user experience are especially welcome. There is [a to do list here](TODO.md)

### Development Guidelines
- Follow veteran-first design principles
- Ensure all features work offline when possible
- Maintain strict data privacy standards
- Test with various input formats and edge cases
- **Important**: Run `npm install` after cloning to generate `package-lock.json` before Docker builds

### Areas for Contribution
- Integration with additional transit APIs
- Support for specialized veteran transportation services
- Enhanced weather decision logic
- Accessibility improvements
- Performance optimizations for various hardware configurations
- Mobile app development for veteran accessibility

## Privacy and Security

- All processing occurs locally within your infrastructure
- No veteran data transmitted to external AI services  
- API keys stored securely in environment variables
- Optional data encryption for sensitive information
- **Laptop-friendly**: Designed to run securely on personal devices without cloud dependencies

## Hardware Compatibility

This solution is specifically designed to run on conventional laptop hardware:

- **MacBook Air M2** (16GB): Fully optimized with ARM64 containers
- **MacBook Pro** (Intel/Apple Silicon): Full compatibility  
- **Windows Laptops** (16GB+): Via Docker Desktop and WSL2
- **Linux Laptops** (8GB+): Native Docker support
- **Chromebooks** (Linux mode): Limited but functional

**No specialized hardware, GPU, or cloud infrastructure required.**

## Support

For issues related to VA facilities or services, please contact the VA directly. For technical support with this application, please open an issue in this repository.

---

*This application is not officially affiliated with the Department of Veterans Affairs. It uses publicly available VA data to provide helpful information to veterans and their families.*
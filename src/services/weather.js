const axios = require('axios');
const { getServiceConfig } = require('../config');

class WeatherService {
  constructor() {
    this.config = getServiceConfig('weather');
    this.openWeatherApiKey = process.env.OPENWEATHERMAP_API_KEY;
    this.weatherApiKey = process.env.WEATHERAPI_KEY;
    this.cacheDuration = parseInt(process.env.WEATHER_CACHE_DURATION) || this.config.cacheDuration;
    this.cache = new Map();
  }

  /**
   * Get current weather and forecast for a location
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<Object>} - Weather data
   */
  async getWeatherData(lat, lng) {
    console.log(`Weather service: Getting data for coordinates: ${lat}, ${lng}`);
    
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      console.error(`Invalid coordinates: lat=${lat}, lng=${lng}`);
      throw new Error('Invalid coordinates provided for weather data');
    }

    const cacheKey = `weather_${lat}_${lng}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheDuration * 1000) {
        console.log('Returning cached weather data');
        
        // Verify cached data is valid
        if (!cached.data || !cached.data.current) {
          console.warn('Invalid cached weather data, fetching new data');
        } else {
          return cached.data;
        }
      }
    }

    try {
      console.log('Weather API keys status:', {
        openWeatherMap: this.openWeatherApiKey ? 'available' : 'missing',
        weatherApi: this.weatherApiKey ? 'available' : 'missing'
      });
      
      let weatherData;
      
      // Try OpenWeatherMap first (primary provider)
      if (this.openWeatherApiKey) {
        console.log('Using OpenWeatherMap API for weather data');
        weatherData = await this.getOpenWeatherData(lat, lng);
      } else if (this.weatherApiKey) {
        console.log('Using WeatherAPI for weather data');
        weatherData = await this.getWeatherApiData(lat, lng);
      } else {
        throw new Error('No weather API keys configured');
      }

      // Verify weather data has the required structure
      if (!weatherData || !weatherData.current) {
        console.error('Invalid weather data structure returned:', weatherData);
        throw new Error('Invalid weather data response');
      }
      
      console.log('Successfully retrieved weather data:', {
        condition: weatherData.current.condition,
        temp: weatherData.current.temperature
      });

      // Cache the result
      this.cache.set(cacheKey, {
        data: weatherData,
        timestamp: Date.now()
      });

      return weatherData;
    } catch (error) {
      console.error('Weather service error:', error.message);
      throw error;
    }
  }

  /**
   * Get weather data from OpenWeatherMap
   * @param {number} lat 
   * @param {number} lng 
   * @returns {Promise<Object>}
   */
  async getOpenWeatherData(lat, lng) {
    console.log(`Fetching OpenWeatherMap data for coordinates: ${lat},${lng}`);
    
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${this.openWeatherApiKey}&units=imperial`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${this.openWeatherApiKey}&units=imperial`;
    
    try {
      console.log('Making API calls to OpenWeatherMap');
      
      const [currentResponse, forecastResponse] = await Promise.all([
        axios.get(currentUrl, { 
          timeout: this.config.requestTimeout,
          headers: { 'User-Agent': 'VA-Facility-App/1.0' }
        }),
        axios.get(forecastUrl, { 
          timeout: this.config.requestTimeout,
          headers: { 'User-Agent': 'VA-Facility-App/1.0' }
        })
      ]);
      
      console.log('Successfully received OpenWeatherMap data');
      
      if (!currentResponse.data || !forecastResponse.data) {
        console.error('Invalid response from OpenWeatherMap API:', {
          currentData: !!currentResponse.data,
          forecastData: !!forecastResponse.data
        });
        throw new Error('Invalid weather API response');
      }
      
      const current = currentResponse.data;
      const forecast = forecastResponse.data;
      
      // Create the weather data object
      let weatherData = {
        current: {
          temperature: current.main && typeof current.main.temp !== 'undefined' ? Math.round(current.main.temp) : null,
          feelsLike: current.main && typeof current.main.feels_like !== 'undefined' ? Math.round(current.main.feels_like) : null,
          humidity: current.main && current.main.humidity,
          pressure: current.main && current.main.pressure,
          visibility: current.visibility ? Math.round(current.visibility * 0.000621371) : null, // Convert m to miles
          windSpeed: current.wind && typeof current.wind.speed !== 'undefined' ? Math.round(current.wind.speed) : null,
          windDirection: current.wind && current.wind.deg,
          description: current.weather && current.weather[0] ? current.weather[0].description : 'No description available',
          condition: current.weather && current.weather[0] ? current.weather[0].main.toLowerCase() : 'unknown',
          icon: current.weather && current.weather[0] ? current.weather[0].icon : null,
          precipitation: current.rain ? (current.rain['1h'] || 0) : 0,
          cloudCover: current.clouds ? current.clouds.all : null
        },
        forecast: forecast.list.slice(0, this.config.forecastHours / this.config.forecastIntervalHours).map(item => ({ // Configurable forecast hours
          time: new Date(item.dt * 1000).toISOString(),
          temperature: Math.round(item.main.temp),
          condition: item.weather[0].main.toLowerCase(),
          description: item.weather[0].description,
          precipitation: item.rain ? (item.rain['3h'] || 0) : 0,
          windSpeed: Math.round(item.wind.speed)
        })),
        alerts: [], // OpenWeatherMap alerts require separate API call
        location: {
          name: current.name,
          country: current.sys.country,
          lat: lat,
          lng: lng
        },
        provider: 'openweathermap',
        timestamp: new Date().toISOString()
      };
      
      // Return the weather data
      return weatherData;
    } catch (error) {
      console.error(`OpenWeatherMap API error for ${lat},${lng}:`, error.message);
      throw new Error(`OpenWeatherMap data fetch failed: ${error.message}`);
    }
  }

  /**
   * Create mock weather data for testing or when API keys are unavailable
   * @param {number} lat 
   * @param {number} lng 
   * @param {string} locationName - Optional location name
   * @returns {Object} Mock weather data
   */
  getMockWeatherData(lat, lng, locationName = 'Test Location') {
    console.log(`Generating mock weather data for ${lat},${lng}`);
    
    // Generate random but realistic weather data
    const temp = Math.floor(Math.random() * 35) + 45; // 45-80°F
    const conditions = ['clear', 'clouds', 'rain', 'mist', 'snow'];
    const descriptions = ['Clear sky', 'Partly cloudy', 'Light rain', 'Mist', 'Light snow'];
    const randomIndex = Math.floor(Math.random() * conditions.length);
    
    return {
      current: {
        temperature: temp,
        feelsLike: temp - 2 + Math.floor(Math.random() * 5),
        humidity: Math.floor(Math.random() * 40) + 30, // 30-70%
        pressure: 1013,
        visibility: 10,
        windSpeed: Math.floor(Math.random() * 15) + 5,
        windDirection: Math.floor(Math.random() * 360),
        description: descriptions[randomIndex],
        condition: conditions[randomIndex],
        icon: '01d',
        precipitation: randomIndex === 2 ? 0.2 : 0, // Rain if condition is rain
        cloudCover: randomIndex === 1 ? 40 : 10 // More clouds if condition is clouds
      },
      forecast: Array.from({ length: 8 }, (_, i) => {
        const forecastTemp = temp + Math.floor(Math.random() * 10) - 5;
        return {
          time: new Date(Date.now() + i * 3600000).toISOString(),
          temperature: forecastTemp,
          condition: conditions[randomIndex],
          description: descriptions[randomIndex],
          precipitation: randomIndex === 2 ? 0.2 : 0,
          windSpeed: Math.floor(Math.random() * 15) + 5
        };
      }),
      alerts: [],
      location: {
        name: locationName,
        country: 'US',
        lat: lat,
        lng: lng
      },
      provider: 'mock',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get weather data from WeatherAPI (alternative provider)
   * @param {number} lat 
   * @param {number} lng 
   * @returns {Promise<Object>}
   */
  async getWeatherApiData(lat, lng) {
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${this.weatherApiKey}&q=${lat},${lng}&days=1&aqi=no&alerts=yes`;
    
    const response = await axios.get(url, { timeout: this.config.requestTimeout });
    const data = response.data;

    return {
      current: {
        temperature: Math.round(data.current.temp_f),
        feelsLike: Math.round(data.current.feelslike_f),
        humidity: data.current.humidity,
        pressure: data.current.pressure_in,
        visibility: Math.round(data.current.vis_miles),
        windSpeed: Math.round(data.current.wind_mph),
        windDirection: data.current.wind_degree,
        description: data.current.condition.text,
        condition: data.current.condition.text.toLowerCase(),
        icon: data.current.condition.icon,
        precipitation: data.current.precip_in,
        cloudCover: data.current.cloud
      },
      forecast: data.forecast.forecastday[0].hour.map(item => ({
        time: item.time,
        temperature: Math.round(item.temp_f),
        condition: item.condition.text.toLowerCase(),
        description: item.condition.text,
        precipitation: item.precip_in,
        windSpeed: Math.round(item.wind_mph)
      })),
      alerts: data.alerts ? data.alerts.alert : [],
      location: {
        name: data.location.name,
        country: data.location.country,
        lat: lat,
        lng: lng
      },
      provider: 'weatherapi',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Analyze weather conditions for transportation impact
   * @param {Object} weatherData - Weather data from getWeatherData
   * @returns {Object} - Weather analysis for transportation
   */
  analyzeWeatherForTransport(weatherData) {
    // Ensure we have valid weather data before proceeding
    if (!weatherData || !weatherData.current) {
      console.log('Invalid weather data provided:', weatherData);
      return {
        current: {
          temperature: 'Unknown',
          feelsLike: 'Unknown',
          condition: 'Unknown',
          description: 'Weather data unavailable'
        },
        severity: 'unknown',
        transportImpact: 'unknown',
        recommendations: ['Check local weather conditions before traveling'],
        warnings: ['Weather information temporarily unavailable'],
        details: {}
      };
    }
    
    const current = weatherData.current;
    const forecast = weatherData.forecast || [];
    
    const analysis = {
      // Include the current weather directly in the analysis object
      current: {
        temperature: current.temperature,
        feelsLike: current.feelsLike,
        condition: current.condition,
        description: current.description
      },
      severity: 'normal',
      transportImpact: 'none',
      recommendations: [],
      warnings: [],
      details: {}
    };

    // Temperature analysis
    if (current.temperature <= 20) {
      analysis.severity = 'severe';
      analysis.transportImpact = 'high';
      analysis.recommendations.push('Minimize outdoor waiting time');
      analysis.recommendations.push('Consider covered transit options');
      analysis.warnings.push(`Very cold: ${current.temperature}°F (feels like ${current.feelsLike}°F)`);
    } else if (current.temperature >= 95) {
      analysis.severity = 'severe';
      analysis.transportImpact = 'high';
      analysis.recommendations.push('Seek air-conditioned transportation');
      analysis.recommendations.push('Stay hydrated and avoid prolonged sun exposure');
      analysis.warnings.push(`Very hot: ${current.temperature}°F (feels like ${current.feelsLike}°F)`);
    }

    // Precipitation analysis
    if (current.precipitation > 0.5) {
      analysis.severity = 'severe';
      analysis.transportImpact = 'high';
      analysis.recommendations.push('Use covered transit stops');
      analysis.recommendations.push('Consider rideshare or taxi options');
      analysis.warnings.push(`Heavy precipitation: ${current.precipitation}" per hour`);
    } else if (current.precipitation > 0.1) {
      analysis.severity = 'moderate';
      analysis.transportImpact = 'medium';
      analysis.recommendations.push('Bring umbrella or rain gear');
      analysis.warnings.push(`Light precipitation expected`);
    }

    // Wind analysis
    if (current.windSpeed > 25) {
      analysis.severity = 'severe';
      analysis.transportImpact = 'high';
      analysis.recommendations.push('Avoid outdoor waiting areas');
      analysis.warnings.push(`High winds: ${current.windSpeed} mph`);
    }

    // Visibility analysis
    if (current.visibility && current.visibility < 0.25) {
      analysis.severity = 'severe';
      analysis.transportImpact = 'high';
      analysis.recommendations.push('Use transit with GPS/navigation');
      analysis.warnings.push(`Very low visibility: ${current.visibility} miles`);
    }

    // Check upcoming weather in forecast
    const nextHours = forecast.slice(0, this.config.analysisHours / this.config.forecastIntervalHours); // Configurable analysis period
    const upcomingRain = nextHours.some(f => f.precipitation > 0.1);
    const upcomingCold = nextHours.some(f => f.temperature < this.config.temperatures.freezing);
    
    if (upcomingRain) {
      analysis.recommendations.push('Rain expected later - plan accordingly');
    }
    
    if (upcomingCold) {
      analysis.warnings.push('Freezing temperatures expected');
    }

    // Overall assessment
    analysis.details = {
      temperature: current.temperature,
      feelsLike: current.feelsLike,
      precipitation: current.precipitation || 0,
      windSpeed: current.windSpeed,
      visibility: current.visibility,
      condition: current.condition,
      alerts: weatherData.alerts?.length || 0
    };
    
    // Double-check that current is properly included
    if (!analysis.current) {
      analysis.current = {
        temperature: current.temperature || 'Unknown',
        feelsLike: current.feelsLike || 'Unknown', 
        condition: current.condition || 'Unknown',
        description: current.description || 'No description available'
      };
    }

    console.log('Weather analysis result:', JSON.stringify(analysis.current));
    return analysis;
  }

  /**
   * Create mock weather data for testing or when API keys are unavailable
   * @param {number} lat 
   * @param {number} lng 
   * @param {string} locationName - Optional location name
   * @returns {Object} Mock weather data
   */
  getMockWeatherData(lat, lng, locationName = 'Test Location') {
    console.log(`Generating mock weather data for ${lat},${lng}`);
    
    // Generate random but realistic weather data
    const temp = Math.floor(Math.random() * 35) + 45; // 45-80°F
    const conditions = ['clear', 'clouds', 'rain', 'mist', 'snow'];
    const descriptions = ['Clear sky', 'Partly cloudy', 'Light rain', 'Mist', 'Light snow'];
    const randomIndex = Math.floor(Math.random() * conditions.length);
    
    return {
      current: {
        temperature: temp,
        feelsLike: temp - 2 + Math.floor(Math.random() * 5),
        humidity: Math.floor(Math.random() * 40) + 30, // 30-70%
        pressure: 1013,
        visibility: 10,
        windSpeed: Math.floor(Math.random() * 15) + 5,
        windDirection: Math.floor(Math.random() * 360),
        description: descriptions[randomIndex],
        condition: conditions[randomIndex],
        icon: '01d',
        precipitation: randomIndex === 2 ? 0.2 : 0, // Rain if condition is rain
        cloudCover: randomIndex === 1 ? 40 : 10 // More clouds if condition is clouds
      },
      forecast: Array.from({ length: 8 }, (_, i) => {
        const forecastTemp = temp + Math.floor(Math.random() * 10) - 5;
        return {
          time: new Date(Date.now() + i * 3600000).toISOString(),
          temperature: forecastTemp,
          condition: conditions[randomIndex],
          description: descriptions[randomIndex],
          precipitation: randomIndex === 2 ? 0.2 : 0,
          windSpeed: Math.floor(Math.random() * 15) + 5
        };
      }),
      alerts: [],
      location: {
        name: locationName,
        country: 'US',
        lat: lat,
        lng: lng
      },
      provider: 'mock',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Clear weather cache
   */
  clearCache() {
    this.cache.clear();
  }
}

module.exports = WeatherService;
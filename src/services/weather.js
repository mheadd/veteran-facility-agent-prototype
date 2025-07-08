const axios = require('axios');
const { getServiceConfig } = require('../config');

class WeatherService {
  constructor() {
    this.config = getServiceConfig('weather');
    this.weatherApiKey = process.env.OPENWEATHERMAP_API_KEY;
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
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      throw new Error('Invalid coordinates provided for weather data');
    }

    const cacheKey = `weather_${lat}_${lng}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheDuration * 1000) {
        console.log('Returning cached weather data');
        return cached.data;
      }
    }

    try {
      let weatherData;
      
      // Try OpenWeatherMap first (primary provider)
      if (this.openWeatherApiKey) {
        weatherData = await this.getOpenWeatherData(lat, lng);
      } else if (this.weatherApiKey) {
        weatherData = await this.getWeatherApiData(lat, lng);
      } else {
        throw new Error('No weather API keys configured');
      }

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
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${this.openWeatherApiKey}&units=imperial`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${this.openWeatherApiKey}&units=imperial`;

    const [currentResponse, forecastResponse] = await Promise.all([
      axios.get(currentUrl, { timeout: this.config.requestTimeout }),
      axios.get(forecastUrl, { timeout: this.config.requestTimeout })
    ]);

    const current = currentResponse.data;
    const forecast = forecastResponse.data;

    return {
      current: {
        temperature: Math.round(current.main.temp),
        feelsLike: Math.round(current.main.feels_like),
        humidity: current.main.humidity,
        pressure: current.main.pressure,
        visibility: current.visibility ? Math.round(current.visibility * 0.000621371) : null, // Convert m to miles
        windSpeed: Math.round(current.wind.speed),
        windDirection: current.wind.deg,
        description: current.weather[0].description,
        condition: current.weather[0].main.toLowerCase(),
        icon: current.weather[0].icon,
        precipitation: current.rain ? (current.rain['1h'] || 0) : 0,
        cloudCover: current.clouds.all
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
    const current = weatherData.current;
    const forecast = weatherData.forecast;
    
    const analysis = {
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
      precipitation: current.precipitation,
      windSpeed: current.windSpeed,
      visibility: current.visibility,
      condition: current.condition,
      alerts: weatherData.alerts?.length || 0
    };

    return analysis;
  }

  /**
   * Clear weather cache
   */
  clearCache() {
    this.cache.clear();
  }
}

module.exports = WeatherService;
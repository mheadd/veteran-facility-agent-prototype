// VA Facility Finder - Streaming Test JavaScript
let eventSource = null;
let searchInProgress = false;
let aiAnalysisStarted = false; // Track if AI analysis has started

function startStreamingSearch() {
    if (searchInProgress) {
        return;
    }

    const address = document.getElementById('address').value.trim();
    const query = document.getElementById('query').value.trim();
    const radius = document.getElementById('radius').value;

    if (!address) {
        alert('Please enter an address or location');
        return;
    }

    searchInProgress = true;
    aiAnalysisStarted = false; // Reset AI analysis flag
    updateButtonStates();
    clearResults();

    // Prepare the search data
    const searchData = {
        address: address,
        radius: parseInt(radius)
    };

    if (query) {
        searchData.query = query;
    }

    // Since EventSource doesn't support POST, we'll use fetch with streaming
    fetchStreamingSearch(searchData);
}

async function fetchStreamingSearch(searchData) {
    try {
        console.log('Search data being sent:', searchData);
        
        const response = await fetch('/api/facilities/find-stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(searchData)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        console.log('Connected to stream, receiving data...');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
                console.log('Stream ended');
                break;
            }

            // Decode the chunk and add to buffer (handles partial messages)
            buffer += decoder.decode(value, { stream: true });
            
            // Split buffer by double newlines (SSE message delimiter)
            const messages = buffer.split('\n\n');
            
            // Keep the last part in the buffer if it doesn't end with \n\n
            buffer = messages.pop() || '';

            for (const message of messages) {
                // Process each complete SSE message
                const lines = message.split('\n');
                let eventData = '';
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        eventData = line.substring(6); // Remove 'data: ' prefix
                    }
                }
                
                if (eventData) {
                    try {
                        const data = JSON.parse(eventData);
                        console.log('Parsed SSE data:', data);
                        handleStreamData(data);
                    } catch (e) {
                        console.warn('Failed to parse SSE data:', eventData, e);
                    }
                }
            }
        }

    } catch (error) {
        console.error('Stream error:', error);
        addStatus(`Error: ${error.message}`, 'error');
    } finally {
        searchInProgress = false;
        updateButtonStates();
    }
}

function handleStreamData(data) {
    // Log the received data for debugging
    console.log('Received stream data:', data);

    if (!data || !data.type || !data.data) {
        console.warn('Invalid data received in stream');
        return;
    }

    switch (data.type) {
        case 'connection':
            break;
        
        case 'status':
            break;
        
        case 'location':
            // Log the complete location data for debugging
            console.log('Received location data:', data.data.location);
            
            if (!data.data.location) {
                addStatus('⚠️ Missing location data', 'error');
            } else {
                const locationAddress = data.data.location.address || 
                                      (data.data.location.fullDetails && data.data.location.fullDetails.formatted_address) || 
                                      'Address not available';
                                      
                addStatus(`📍 Location found: ${locationAddress}`, 'success');
                displayLocation(data.data.location);
            }
            break;
        
        case 'facilities':
            // Ensure facilities is an array before displaying
            if (Array.isArray(data.data.facilities)) {
                displayFacilities(data.data.facilities);
            } else {
                console.warn('Invalid facilities data: not an array');
                addStatus('⚠️ Invalid facilities data received', 'error');
            }
            break;
        
        case 'weather':
            console.log('Weather stream data received:', data.data);
            
            if (!data.data.weather) {
                console.error('Missing weather data in SSE response');
                addStatus('⚠️ Weather data could not be retrieved', 'error');
            } else {
                console.log('Weather details:', {
                    'has_current': !!data.data.weather.current,
                    'current': data.data.weather.current,
                    'severity': data.data.weather.severity,
                    'has_error': !!data.data.weather.error
                });
                
                displayWeather(data.data.weather);
            }
            break;
        
        case 'transportation':
            displayTransportation(data.data.transportation);
            break;
        
        case 'ai_analysis':
            handleAIAnalysis(data.data);
            break;
        
        case 'complete':
            break;
        
        case 'error':
            addStatus(`❌ ${data.data.message || 'An error occurred'}`, 'error');
            break;
    }
}

function handleAIAnalysis(data) {
    if (data.type === 'analysis_chunk') {
        // Only show the "AI analysis in progress..." message once
        if (!aiAnalysisStarted) {
            addStatus('🤖 Generating AI recommendations... Please wait.', 'info');
            aiAnalysisStarted = true;
        }
        displayAIGuidance(data.analysis, false);
    } else if (data.type === 'analysis_complete') {
        displayAIGuidance(data.analysis, true);
    } else if (data.type === 'analysis_error') {
        if (data.fallback) {
            displayAIGuidance(data.fallback, true);
        }
    } else if (data.type === 'analysis_unavailable') {
        // No action needed - just don't show AI section
    }
}

function displayLocation(location) {
    const results = document.getElementById('results');
    const locationDiv = document.createElement('div');
    locationDiv.className = 'status success';
    
    if (!location) {
        locationDiv.innerHTML = `
            <h3>📍 Location</h3>
            <p>Location data not available</p>
        `;
    } else {
        // Try multiple possible address fields with fallbacks
        const displayAddress = location.address || 
                              (location.fullDetails && location.fullDetails.formatted_address) || 
                              'Address not available';
        
        // For debugging
        console.log('Location data for display:', location);
                              
        locationDiv.innerHTML = `
            <h3>📍 Location Found</h3>
            <p><strong>Address:</strong> ${displayAddress}</p>
            <p><strong>Coordinates:</strong> ${location.lat !== undefined ? location.lat : '?'}, ${location.lng !== undefined ? location.lng : '?'}</p>
        `;
    }
    results.appendChild(locationDiv);
}

function displayFacilities(facilities) {
    const results = document.getElementById('results');
    const facilitiesDiv = document.createElement('div');
    facilitiesDiv.className = 'facilities-section';
    facilitiesDiv.innerHTML = `<h3>🏥 VA Facilities (${facilities.length} found)</h3>`;

    facilities.forEach((facility, index) => {
        const facilityCard = document.createElement('div');
        facilityCard.className = 'facility-card';
        facilityCard.innerHTML = `
            <div class="facility-name">${facility.name || 'Unknown Facility'}</div>
            <div class="facility-info">
                <div class="info-item"><strong>Type:</strong> ${facility.type || 'Not specified'}</div>
                <div class="info-item"><strong>Distance:</strong> ${facility.distance || 'Unknown'} miles</div>
                <div class="info-item"><strong>Phone:</strong> ${facility.phone || 'N/A'}</div>
                <div class="info-item"><strong>Address:</strong> ${(facility.location && facility.location.address && facility.location.address.full) ? facility.location.address.full : 'Address not available'}</div>
            </div>
        `;
        facilitiesDiv.appendChild(facilityCard);
    });

    results.appendChild(facilitiesDiv);
}

function displayWeather(weather) {
    const results = document.getElementById('results');
    const weatherDiv = document.createElement('div');
    weatherDiv.className = 'status';
    
    // Debug weather data
    console.log('Weather data received for display:', weather);
    
    if (!weather || weather.error) {
        weatherDiv.innerHTML = `
            <h3>🌤️ Weather Information</h3>
            <p>⚠️ ${weather && weather.error ? weather.error : 'Weather data not available'}</p>
        `;
    } else {
        // Safely extract weather properties with thorough checks
        let current = weather.current || {};
        
        // Get values with fallbacks
        const currentCondition = current.condition || 'Unknown';
        const temperature = current.temperature !== undefined && current.temperature !== null ? current.temperature : 'Unknown';
        const description = current.description || '';
        const feelsLike = current.feelsLike !== undefined && current.feelsLike !== null ? current.feelsLike : '';
        
        // Format temperature with unit only when it's a number
        const tempDisplay = temperature !== 'Unknown' ? `${temperature}°F` : 'Unknown';
        const feelsLikeDisplay = feelsLike ? ` (feels like ${feelsLike}°F)` : '';
        
        // Format condition with description when available
        const conditionDisplay = currentCondition !== 'Unknown' && description 
                              ? `${currentCondition} - ${description}` 
                              : currentCondition;
        
        weatherDiv.innerHTML = `
            <h3>🌤️ Weather Information</h3>
            <p><strong>Current:</strong> ${conditionDisplay}</p>
            <p><strong>Temperature:</strong> ${tempDisplay}${feelsLikeDisplay}</p>
            <p><strong>Travel Impact:</strong> ${weather.severity || 'Normal'}</p>
        `;
        
        // Add warnings if available
        if (weather.warnings && weather.warnings.length > 0) {
            const warningsHtml = weather.warnings.map(warning => 
                `<li>${warning}</li>`
            ).join('');
            
            weatherDiv.innerHTML += `
                <p><strong>Warnings:</strong></p>
                <ul>${warningsHtml}</ul>
            `;
        }
        
        // Add recommendations if available
        if (weather.recommendations && weather.recommendations.length > 0) {
            const recommendationsHtml = weather.recommendations.map(rec => 
                `<li>${rec}</li>`
            ).join('');
            
            weatherDiv.innerHTML += `
                <p><strong>Recommendations:</strong></p>
                <ul>${recommendationsHtml}</ul>
            `;
        }
    }
    
    results.appendChild(weatherDiv);
}

function displayTransportation(transportation) {
    const results = document.getElementById('results');
    const transportDiv = document.createElement('div');
    transportDiv.className = 'status';
    
    if (!transportation || transportation.error) {
        transportDiv.innerHTML = `
            <h3>🚗 Transportation Options</h3>
            <p>⚠️ ${transportation && transportation.error ? transportation.error : 'Transportation data not available'}</p>
            <p><em>${transportation && transportation.fallback ? transportation.fallback : ''}</em></p>
        `;
    } else {
        // Handle both direct options and nested structure
        const drivingOption = transportation.driving || (transportation.options && transportation.options.driving);
        const walkingOption = transportation.walking || (transportation.options && transportation.options.walking);
        const transitOption = transportation.transit || (transportation.options && transportation.options.transit);
        const rideshareOption = transportation.rideshare || (transportation.options && transportation.options.rideshare);
        
        let transportationHTML = `
            <h3>🚗 Transportation Options</h3>
            <div class="facility-info">
                ${drivingOption ? `<div class="info-item"><strong>🚗 Driving:</strong> ${drivingOption.bestRoute && drivingOption.bestRoute.duration ? drivingOption.bestRoute.duration : 'N/A'}</div>` : ''}
                ${walkingOption ? `<div class="info-item"><strong>🚶 Walking:</strong> ${walkingOption.bestRoute && walkingOption.bestRoute.duration ? walkingOption.bestRoute.duration : 'N/A'}</div>` : ''}
                ${transitOption ? `<div class="info-item"><strong>🚌 Transit:</strong> ${transitOption.bestRoute && transitOption.bestRoute.duration ? transitOption.bestRoute.duration : 'N/A'}</div>` : ''}
            </div>
        `;

        // Add rideshare options if available
        if (rideshareOption && rideshareOption.available && rideshareOption.options) {
            transportationHTML += `
                <div class="rideshare-options">
                    <h4>🚖 Rideshare Options</h4>
                    <div class="rideshare-buttons">
            `;
            
            rideshareOption.options.forEach(option => {
                transportationHTML += `
                    <div class="rideshare-option">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong>${option.provider}</strong><br>
                                <small style="color: #666;">${option.description}</small><br>
                                <small style="color: #28a745;"><strong>Est. Time:</strong> ${option.estimatedTime}</small><br>
                                <small style="color: #007bff;"><strong>Est. Cost:</strong> ${option.estimatedCost}</small>
                            </div>
                            <div>
                                <a href="${option.deepLink}" 
                                   class="rideshare-button"
                                   onclick="handleRideshareClick('${option.deepLink}', '${option.webLink}', '${option.provider}'); return false;">
                                   Open ${option.provider}
                                </a>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            transportationHTML += `
                    </div>
                </div>
            `;
        }
        
        transportDiv.innerHTML = transportationHTML;
    }
    
    results.appendChild(transportDiv);
}

function handleRideshareClick(deepLink, webLink, provider) {
    // Try to open the deep link first (mobile app)
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = deepLink;
    document.body.appendChild(iframe);
    
    // Fallback to web link after a short delay
    setTimeout(() => {
        document.body.removeChild(iframe);
        window.open(webLink, '_blank');
    }, 1000);
}

function displayAIGuidance(guidance, isComplete) {
    let aiDiv = document.getElementById('ai-guidance');
    
    if (!aiDiv) {
        aiDiv = document.createElement('div');
        aiDiv.id = 'ai-guidance';
        aiDiv.className = 'ai-guidance';
        document.getElementById('results').appendChild(aiDiv);
    }

    const streamingIndicator = isComplete ? '' : '<span class="streaming-indicator"></span>';
    
    aiDiv.innerHTML = `
        <h3>🤖 AI Recommendations ${streamingIndicator}</h3>
        ${guidance.primaryRecommendation ? `
            <div class="ai-section">
                <h4>Primary Recommendation:</h4>
                <p>${guidance.primaryRecommendation}</p>
            </div>
        ` : ''}
        ${guidance.reasoning ? `
            <div class="ai-section">
                <h4>Reasoning:</h4>
                <p>${guidance.reasoning}</p>
            </div>
        ` : ''}
        ${guidance.travelAdvice ? `
            <div class="ai-section">
                <h4>Travel Advice:</h4>
                <p>${guidance.travelAdvice}</p>
            </div>
        ` : ''}
        ${guidance.weatherConsiderations ? `
            <div class="ai-section">
                <h4>Weather Considerations:</h4>
                <p>${guidance.weatherConsiderations}</p>
            </div>
        ` : ''}
        ${guidance.additionalTips ? `
            <div class="ai-section">
                <h4>Additional Tips:</h4>
                <p>${guidance.additionalTips}</p>
            </div>
        ` : ''}
    `;
}

function addStatus(message, type = 'info') {
    const results = document.getElementById('results');
    const statusDiv = document.createElement('div');
    statusDiv.className = `status ${type}`;
    statusDiv.innerHTML = message;
    results.appendChild(statusDiv);
    
    // Auto scroll to bottom
    statusDiv.scrollIntoView({ behavior: 'smooth' });
}

function clearResults() {
    document.getElementById('results').innerHTML = '';
}

function stopSearch() {
    if (eventSource) {
        eventSource.close();
        eventSource = null;
    }
    searchInProgress = false;
    updateButtonStates();
    addStatus('🛑 Search stopped by user', 'info');
}

function updateButtonStates() {
    document.getElementById('searchBtn').disabled = searchInProgress;
    document.getElementById('stopBtn').disabled = !searchInProgress;
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set up event handlers
    document.getElementById('searchBtn').addEventListener('click', startStreamingSearch);
    document.getElementById('stopBtn').addEventListener('click', stopSearch);
    
    // Enable Enter key for search
    document.getElementById('address').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            startStreamingSearch();
        }
    });
    
    document.getElementById('query').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            startStreamingSearch();
        }
    });
});

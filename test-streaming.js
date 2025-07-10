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
    showLogs();

    // Prepare the search data
    const searchData = {
        address: address,
        radius: parseInt(radius)
    };

    if (query) {
        searchData.query = query;
    }

    log('🚀 Starting streaming search...', 'info');

    // Since EventSource doesn't support POST, we'll use fetch with streaming
    fetchStreamingSearch(searchData);
}

async function fetchStreamingSearch(searchData) {
    try {
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

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
                log('✅ Stream ended', 'success');
                break;
            }

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.substring(6));
                        handleStreamData(data);
                    } catch (e) {
                        console.warn('Failed to parse SSE data:', line);
                    }
                }
            }
        }

    } catch (error) {
        log(`❌ Stream error: ${error.message}`, 'error');
        addStatus(`Error: ${error.message}`, 'error');
    } finally {
        searchInProgress = false;
        updateButtonStates();
    }
}

function handleStreamData(data) {
    log(`📨 ${data.type}: ${JSON.stringify(data.data)}`, 'data');

    switch (data.type) {
        case 'connection':
            addStatus(data.data.message, 'success');
            break;
        
        case 'status':
            addStatus(`Step: ${data.data.step} - ${data.data.message}`);
            break;
        
        case 'location':
            addStatus(`📍 ${data.data.message}`, 'success');
            displayLocation(data.data.location);
            break;
        
        case 'facilities':
            addStatus(`🏥 ${data.data.message}`, 'success');
            displayFacilities(data.data.facilities);
            break;
        
        case 'weather':
            addStatus(`🌤️ ${data.data.message}`, 'success');
            displayWeather(data.data.weather);
            break;
        
        case 'transportation':
            addStatus(`🚗 ${data.data.message}`, 'success');
            displayTransportation(data.data.transportation);
            break;
        
        case 'ai_analysis':
            handleAIAnalysis(data.data);
            break;
        
        case 'complete':
            addStatus(`🎉 ${data.data.message}`, 'success');
            break;
        
        case 'error':
            addStatus(`❌ ${data.data.message}`, 'error');
            break;
    }
}

function handleAIAnalysis(data) {
    if (data.type === 'analysis_chunk') {
        // Only show the "AI analysis streaming..." message once
        if (!aiAnalysisStarted) {
            addStatus('🤖 AI analysis streaming...', 'info');
            aiAnalysisStarted = true;
        }
        displayAIGuidance(data.analysis, false);
    } else if (data.type === 'analysis_complete') {
        addStatus('✅ AI analysis completed', 'success');
        displayAIGuidance(data.analysis, true);
    } else if (data.type === 'analysis_error') {
        addStatus(`❌ AI analysis error: ${data.error}`, 'error');
        if (data.fallback) {
            displayAIGuidance(data.fallback, true);
        }
    } else if (data.type === 'analysis_unavailable') {
        addStatus('⚠️ AI analysis unavailable', 'info');
    }
}

function displayLocation(location) {
    const results = document.getElementById('results');
    const locationDiv = document.createElement('div');
    locationDiv.className = 'status success';
    locationDiv.innerHTML = `
        <h3>📍 Location Found</h3>
        <p><strong>Address:</strong> ${location.address}</p>
        <p><strong>Coordinates:</strong> ${location.lat}, ${location.lng}</p>
    `;
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
            <div class="facility-name">${facility.name}</div>
            <div class="facility-info">
                <div class="info-item"><strong>Type:</strong> ${facility.type}</div>
                <div class="info-item"><strong>Distance:</strong> ${facility.distance} miles</div>
                <div class="info-item"><strong>Phone:</strong> ${facility.phone || 'N/A'}</div>
                <div class="info-item"><strong>Address:</strong> ${facility.location?.address?.full || 'N/A'}</div>
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
    
    if (weather.error) {
        weatherDiv.innerHTML = `
            <h3>🌤️ Weather Information</h3>
            <p>⚠️ ${weather.error}</p>
        `;
    } else {
        weatherDiv.innerHTML = `
            <h3>🌤️ Weather Information</h3>
            <p><strong>Current:</strong> ${weather.current?.condition || 'Unknown'}</p>
            <p><strong>Temperature:</strong> ${weather.current?.temperature || 'Unknown'}°F</p>
            <p><strong>Travel Impact:</strong> ${weather.severity || 'Normal'}</p>
        `;
    }
    
    results.appendChild(weatherDiv);
}

function displayTransportation(transportation) {
    const results = document.getElementById('results');
    const transportDiv = document.createElement('div');
    transportDiv.className = 'status';
    
    if (transportation.error) {
        transportDiv.innerHTML = `
            <h3>🚗 Transportation Options</h3>
            <p>⚠️ ${transportation.error}</p>
            <p><em>${transportation.fallback || ''}</em></p>
        `;
    } else {
        const options = transportation.options || {};
        transportDiv.innerHTML = `
            <h3>🚗 Transportation Options</h3>
            <div class="facility-info">
                ${options.driving ? `<div class="info-item"><strong>🚗 Driving:</strong> ${options.driving.bestRoute?.duration || 'N/A'}</div>` : ''}
                ${options.walking ? `<div class="info-item"><strong>🚶 Walking:</strong> ${options.walking.bestRoute?.duration || 'N/A'}</div>` : ''}
                ${options.transit ? `<div class="info-item"><strong>🚌 Transit:</strong> ${options.transit.bestRoute?.duration || 'N/A'}</div>` : ''}
            </div>
        `;
    }
    
    results.appendChild(transportDiv);
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

function showLogs() {
    document.getElementById('logs').style.display = 'block';
}

function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logEntries = document.getElementById('logEntries');
    const logDiv = document.createElement('div');
    logDiv.className = 'log-entry';
    logDiv.innerHTML = `
        <span class="log-timestamp">[${timestamp}]</span> 
        <span class="log-type">${type.toUpperCase()}:</span> 
        ${message}
    `;
    logEntries.appendChild(logDiv);
    logEntries.scrollTop = logEntries.scrollHeight;
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

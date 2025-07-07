#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database configuration
const DB_PATH = process.env.SQLITE_DB_PATH || './data/veteran_agent.db';
const DATA_DIR = path.dirname(DB_PATH);

console.log('🗄️  Initializing Veteran Facility Agent Database...');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log(`📁 Created data directory: ${DATA_DIR}`);
}

// Initialize SQLite database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to SQLite database');
});

// Create tables
db.serialize(() => {
  // Sessions table for user interactions
  db.run(`CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_location TEXT,
    last_facility TEXT,
    preferences TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('❌ Error creating sessions table:', err.message);
    } else {
      console.log('✅ Sessions table ready');
    }
  });

  // Facilities cache table for VA facility data
  db.run(`CREATE TABLE IF NOT EXISTS facilities_cache (
    id TEXT PRIMARY KEY,
    facility_data TEXT,
    location_lat REAL,
    location_lng REAL,
    cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME
  )`, (err) => {
    if (err) {
      console.error('❌ Error creating facilities_cache table:', err.message);
    } else {
      console.log('✅ Facilities cache table ready');
    }
  });

  // Weather cache table for weather data
  db.run(`CREATE TABLE IF NOT EXISTS weather_cache (
    id TEXT PRIMARY KEY,
    location TEXT,
    weather_data TEXT,
    cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME
  )`, (err) => {
    if (err) {
      console.error('❌ Error creating weather_cache table:', err.message);
    } else {
      console.log('✅ Weather cache table ready');
    }
  });

  // Transit routes cache
  db.run(`CREATE TABLE IF NOT EXISTS transit_cache (
    id TEXT PRIMARY KEY,
    origin TEXT,
    destination TEXT,
    route_data TEXT,
    cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME
  )`, (err) => {
    if (err) {
      console.error('❌ Error creating transit_cache table:', err.message);
    } else {
      console.log('✅ Transit cache table ready');
    }
  });

  // User preferences
  db.run(`CREATE TABLE IF NOT EXISTS user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    preference_key TEXT,
    preference_value TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(session_id) REFERENCES sessions(id)
  )`, (err) => {
    if (err) {
      console.error('❌ Error creating user_preferences table:', err.message);
    } else {
      console.log('✅ User preferences table ready');
    }
  });

  // Create indexes for better performance
  db.run(`CREATE INDEX IF NOT EXISTS idx_sessions_location ON sessions(user_location)`, (err) => {
    if (err) {
      console.error('❌ Error creating sessions location index:', err.message);
    } else {
      console.log('✅ Sessions location index ready');
    }
  });

  db.run(`CREATE INDEX IF NOT EXISTS idx_facilities_location ON facilities_cache(location_lat, location_lng)`, (err) => {
    if (err) {
      console.error('❌ Error creating facilities location index:', err.message);
    } else {
      console.log('✅ Facilities location index ready');
    }
  });

  db.run(`CREATE INDEX IF NOT EXISTS idx_weather_location ON weather_cache(location)`, (err) => {
    if (err) {
      console.error('❌ Error creating weather location index:', err.message);
    } else {
      console.log('✅ Weather location index ready');
    }
  });

  // Insert some initial data for testing
  db.run(`INSERT OR IGNORE INTO user_preferences (session_id, preference_key, preference_value) 
          VALUES ('default', 'default_search_radius', '50')`, (err) => {
    if (err) {
      console.error('❌ Error inserting default preferences:', err.message);
    } else {
      console.log('✅ Default preferences inserted');
    }
  });

  db.run(`INSERT OR IGNORE INTO user_preferences (session_id, preference_key, preference_value) 
          VALUES ('default', 'max_facilities_returned', '5')`, (err) => {
    if (err) {
      console.error('❌ Error inserting default preferences:', err.message);
    } else {
      console.log('✅ Default facility limit inserted');
    }
  });
});

// Close database connection
db.close((err) => {
  if (err) {
    console.error('❌ Error closing database:', err.message);
    process.exit(1);
  }
  console.log('✅ Database initialization complete!');
  console.log(`📍 Database location: ${path.resolve(DB_PATH)}`);
  console.log('🎉 Veteran Facility Agent database is ready for use');
  process.exit(0);
});
-- EcoWatch AI Database Schema
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    boundary GEOMETRY(Polygon, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS environmental_snapshots (
    id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
    aqi INTEGER,
    pm25 DOUBLE PRECISION,
    pm10 DOUBLE PRECISION,
    no2 DOUBLE PRECISION,
    co DOUBLE PRECISION,
    ozone DOUBLE PRECISION,
    temperature DOUBLE PRECISION,
    feels_like DOUBLE PRECISION,
    humidity INTEGER,
    wind_speed DOUBLE PRECISION,
    uv_index DOUBLE PRECISION,
    ndvi DOUBLE PRECISION,
    urban_heat_index DOUBLE PRECISION,
    green_coverage_pct DOUBLE PRECISION,
    water_proximity_km DOUBLE PRECISION,
    risk_score INTEGER,
    risk_level VARCHAR(20),
    raw_data JSONB,
    captured_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recommendations (
    id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
    snapshot_id INTEGER REFERENCES environmental_snapshots(id) ON DELETE CASCADE,
    category VARCHAR(50),
    priority VARCHAR(20),
    title VARCHAR(255),
    description TEXT,
    actions JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_snapshots_location ON environmental_snapshots(location_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_captured ON environmental_snapshots(captured_at);
CREATE INDEX IF NOT EXISTS idx_locations_coords ON locations USING GIST (
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
);

CREATE TABLE IF NOT EXISTS environmental_history (
    id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
    aqi INTEGER NOT NULL,
    temperature DOUBLE PRECISION NOT NULL,
    humidity INTEGER NOT NULL,
    ndvi_score DOUBLE PRECISION NOT NULL,
    risk_score INTEGER NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS favorite_locations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    location_name VARCHAR(255) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_history_location ON environmental_history(location_id);
CREATE INDEX IF NOT EXISTS idx_history_timestamp ON environmental_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorite_locations(user_id);

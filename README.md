# EcoWatch AI — Environmental Health Intelligence Platform

EcoWatch AI provides environmental and pollution intelligence for any selected geographic area. Select a location on an interactive map, analyze environmental conditions, and receive AI-generated recommendations.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Next.js    │────▶│  FastAPI     │────▶│  PostgreSQL     │
│  Frontend   │     │  Backend     │     │  + PostGIS      │
└─────────────┘     └──────┬───────┘     └─────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────────┐
        │Processing│ │AI Engine │ │ External APIs│
        │ Module   │ │          │ │ OpenWeather  │
        └──────────┘ └──────────┘ │ WAQI, GEE    │
                                  └──────────────┘
```

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+
- Python 3.11+
- API keys (optional for MVP — mock data available)

### Environment Setup

```bash
cp .env.example .env
# Edit .env with your API keys
```

### Run with Docker

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Local Development

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## MVP Features

- Interactive map with location search and area selection
- Real-time air pollution metrics (AQI, PM2.5, PM10, NO₂, CO, Ozone)
- Weather conditions (temperature, humidity, wind, UV)
- Vegetation analysis (NDVI)
- Environmental risk scoring (0–100)
- AI-generated recommendations

## Project Structure

```
ecowatch-ai/
├── frontend/           # Next.js dashboard
├── backend/            # FastAPI API layer
├── processing/         # Satellite & raster processing
├── ai-recommendations/ # AI recommendation engine
├── infrastructure/     # Docker, CI/CD, AWS
├── datasets/           # Sample data & schemas
└── docs/               # Architecture documentation
```

## API Keys

| Service | Env Variable | Purpose |
|---------|-------------|---------|
| OpenWeather | `OPENWEATHER_API_KEY` | Weather & air pollution |
| WAQI | `WAQI_API_KEY` | Air quality index |
| Google Earth Engine | `GEE_SERVICE_ACCOUNT` | Satellite imagery |

Without API keys, the system uses realistic mock data for development.

## License

MIT

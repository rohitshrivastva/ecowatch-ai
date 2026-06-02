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

- Marketing site: [http://localhost:3000/](http://localhost:3000/)
- Dashboard app: [http://localhost:3000/app](http://localhost:3000/app)

Optional env for production CTAs and subdomain routing:

- `NEXT_PUBLIC_APP_URL` — e.g. `https://app.ecowatchai.com` (used by landing CTAs)
- Middleware rewrites `app.ecowatchai.com/` → `/app` when deployed on the same Next.js host

## MVP Features

- Interactive map with location search and area selection
- Real-time air pollution metrics (AQI, PM2.5, PM10, NO₂, CO, Ozone)
- Weather conditions (temperature, humidity, wind, UV)
- Vegetation analysis (NDVI)
- Environmental risk scoring (0–100)
- AI-generated recommendations
- **Historical trends** — AQI, temperature, humidity, NDVI, and risk over 24h / 7d / 30d / 1y
- **Favorite locations** — save and monitor places (requires sign-in)
- **Environmental heatmaps** — AQI, temperature, vegetation, and combined risk overlays on the map

### Intelligence APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/history/trends` | GET | Trend series and change metrics (`location_id`, `period`) |
| `/api/v1/history/comparison` | GET | Period-over-period comparison |
| `/api/v1/history/{location_id}` | GET | Paginated history records |
| `/api/v1/favorites` | POST/GET | Create or list favorites (JWT) |
| `/api/v1/favorites/{id}` | PUT/DELETE | Update or remove a favorite |
| `/api/v1/heatmap/aqi` | GET | Heatmap points in map bounds |
| `/api/v1/heatmap/temperature` | GET | Temperature intensity grid |
| `/api/v1/heatmap/vegetation` | GET | NDVI-based vegetation overlay |
| `/api/v1/heatmap/environmental-risk` | GET | Combined environmental risk |

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

## Authentication (optional)

Sign in and register are available at `/login` and `/register` but **not required** by default — the dashboard works without an account.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/register` | POST | Create account (email, password, optional name) |
| `/api/v1/auth/login` | POST | Sign in, returns JWT |
| `/api/v1/auth/me` | GET | Current user (Bearer token) |

To **require login** for analysis later, set `REQUIRE_AUTH=true` on the backend (and redeploy).

**Production:** set a strong `JWT_SECRET_KEY` in Render when using auth.

## API Keys

| Service | Env Variable | Purpose |
|---------|-------------|---------|
| OpenWeather | `OPENWEATHER_API_KEY` | Weather & air pollution |
| WAQI | `WAQI_API_KEY` | Air quality index |
| Google Earth Engine | `GEE_SERVICE_ACCOUNT` | Satellite imagery |
| Auth | `JWT_SECRET_KEY` | Sign JWT tokens (required in production) |

Without API keys, the system uses realistic mock data for development.

## License

MIT

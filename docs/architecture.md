# EcoWatch AI — Architecture Documentation

## System Overview

EcoWatch AI is a modular full-stack platform for environmental health intelligence. Users select geographic areas via an interactive map, and the system aggregates data from weather APIs, pollution APIs, and satellite processing to produce environmental metrics, risk scores, and AI recommendations.

## Component Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                     │
│  Map (Leaflet) │ Dashboard │ Charts (Recharts) │ AI Panel   │
└──────────────────────────┬───────────────────────────────────┘
                           │ REST API
┌──────────────────────────▼───────────────────────────────────┐
│                     BACKEND (FastAPI)                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────────┐ │
│  │ Weather  │ │Pollution │ │Satellite │ │ Risk Scoring    │ │
│  │ Service  │ │ Service  │ │ Service  │ │ Engine          │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬────────┘ │
│       │            │            │                 │          │
│  ┌────▼────────────▼────────────▼─────────────────▼────────┐ │
│  │              Analysis Orchestrator                        │ │
│  └──────────────────────────┬───────────────────────────────┘ │
│                             │                                  │
│  ┌──────────┐  ┌───────────▼──────────┐  ┌─────────────────┐│
│  │  Cache   │  │  AI Recommendations  │  │  PostgreSQL     ││
│  │ (Redis)  │  │  Engine              │  │  + PostGIS      ││
│  └──────────┘  └──────────────────────┘  └─────────────────┘│
└──────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────┐
│                   PROCESSING MODULE                           │
│  NDVI Processor │ Urban Heat Analyzer │ Raster Processor    │
└──────────────────────────────────────────────────────────────┘
```

## Data Flow

1. **Location Selection** — User clicks map, searches, or draws area boundary
2. **Parallel Data Fetch** — Backend concurrently fetches pollution, weather, and satellite data
3. **Processing** — NDVI computed, urban heat analyzed, environmental indicators derived
4. **Risk Scoring** — Weighted composite score (0–100) from 6 factors
5. **AI Recommendations** — Rule-based engine + optional LLM enhancement
6. **Response** — Cached JSON returned to frontend dashboard

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/analyze?lat=&lon=` | Quick coordinate analysis |
| POST | `/api/v1/analyze` | Full analysis with boundary |

## Risk Scoring Algorithm

| Factor | Weight | Input |
|--------|--------|-------|
| Air Quality | 30% | AQI value |
| Vegetation | 20% | NDVI |
| Green Coverage | 15% | Percentage |
| Temperature | 15% | °C deviation from 22°C |
| Urban Heat | 15% | Heat index ratio |
| Humidity | 5% | % deviation from 30–60% |

**Score Ranges:** 0–30 Healthy, 31–60 Moderate Risk, 61–100 High Risk

## External API Integration

| API | Data | Fallback |
|-----|------|----------|
| OpenWeather | Weather + Air Pollution | Mock data |
| WAQI | Air Quality Index | Mock data |
| OpenStreetMap Nominatim | Geocoding | Client-side only |
| OpenAI | Enhanced recommendations | Rule-based only |
| Sentinel-2 / GEE | Satellite bands | Simulated NDVI |

## Scalability Considerations

- **Caching**: Redis with 5-minute TTL on analysis results
- **Async**: All I/O-bound operations use asyncio
- **Modular services**: Each data source is an independent service
- **Stateless backend**: Horizontally scalable via ECS
- **Database**: PostGIS for spatial queries on area boundaries

## Future Enhancements

- Celery task queue for heavy raster processing
- WebSocket streaming for real-time monitoring
- Time-series storage for historical trend analysis
- ML models for pollution forecasting

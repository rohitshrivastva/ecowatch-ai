# EcoWatch AI — Product

## Vision

EcoWatch AI is an **AI Environmental Assistant**, not a scientific monitoring dashboard. Users should instantly understand environmental health, risk level, and what to do next—without reading dozens of indicators.

## Target experience

1. Open app → environmental overview (score, AQI, temperature, AI insight)
2. Understand risk quickly
3. See actionable recommendations
4. Explore map and heatmaps (one layer at a time)
5. Open advanced analytics only when needed

## Audiences

- Residents and community groups seeking local environmental clarity
- Planners and smart-city teams evaluating areas on a map
- Operators monitoring saved favorite locations (authenticated)

## Routes (SaaS)

| Surface | URL (dev) | URL (prod) |
|---------|-----------|------------|
| Marketing | `/` | `ecowatchai.com` |
| Dashboard | `/app` | `app.ecowatchai.com` (middleware rewrites `/` → `/app`) |
| Auth | `/login`, `/register` | Same paths on app or shared host |

Env: `NEXT_PUBLIC_APP_URL` for CTA links from marketing.

## Core features (MVP)

- **Environmental Health Score** (0–100) + risk level
- **Hero metrics**: AQI, temperature, synthesized AI insight
- **Map**: click, search (Nominatim), draw area; auto geolocation on first visit
- **AI recommendations**: priority-ordered cards (Why + Suggested Actions)
- **Advanced Analytics** (collapsed): pollutants, weather, NDVI, risk gauge, pollution chart
- **Historical trends** (expandable): 24h / 7d / 30d / 1y
- **Heatmaps** (opt-in): AQI, temperature, vegetation, environmental risk
- **Favorites** (JWT): save and revisit locations

## Non-goals (current MVP)

- Real-time WebSocket streaming
- Multi-tenant org admin
- Native mobile apps
- Public API for third parties

## Success metrics (product)

- Time to first meaningful overview after load
- % users who open Advanced Analytics (should be minority)
- Recommendation engagement (expand / view all)
- Heatmap enable rate without hurting LCP on `/app`
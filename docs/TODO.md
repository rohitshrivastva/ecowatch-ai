# EcoWatch AI — TODO

Tracked work items for the EcoWatch platform. Informal notes go in [SCRATCHPAD.md](./SCRATCHPAD.md).

## Completed (UI/UX refactor)

- [x] Marketing `/` + dashboard `/app` route groups
- [x] Subdomain middleware (`app.ecowatchai.com` → `/app`)
- [x] Hero-first dashboard with collapsed Advanced Analytics
- [x] `InsightRecommendations` (Risk / Why / Suggested Actions)
- [x] TanStack Query for environmental analysis (5 min stale)
- [x] Skeleton loaders + `EnvironmentalLoading` states
- [x] Heatmap radio controls, mobile positioning, 60s client cache
- [x] `HeatmapLayer` `setLatLngs` optimization when type unchanged
- [x] Recommendation engine copy improvements (`ai-recommendations/engine.py`)
- [x] Documentation suite under `docs/`

## High priority

- [ ] Production env: `NEXT_PUBLIC_APP_URL`, `JWT_SECRET_KEY`, external API keys
- [ ] Real dashboard screenshot on marketing preview panel
- [ ] `useTrends` React Query hook (trends still load inside `HistoricalTrendsPanel` on expand)
- [ ] E2E smoke: geolocation → analyze → heatmap toggle → favorites (authenticated)
- [ ] Wire `?demo=1` on `/app` to a fixed demo city (marketing CTA exists)

## Medium priority

- [ ] Optional heatmap type prefetch on control hover
- [ ] Polling or WebSocket for favorite location summary cards
- [ ] `AuthGuard` on `/app` when `REQUIRE_AUTH=true`
- [ ] Shareable analysis deep link (`/app?lat=&lon=`)

## Low priority / future

- [ ] Celery task queue for heavy raster processing
- [ ] ML-based pollution forecasting
- [ ] i18n for recommendations and UI
- [ ] Light theme (currently dark-only by design — see [UI_UX_RULES.md](./UI_UX_RULES.md))

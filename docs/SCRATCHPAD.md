# Scratchpad

Informal development notes. **Not authoritative** — verify against code and [ARCHITECTURE.md](./ARCHITECTURE.md) before implementing.

## Quick links

| Area | Path |
|------|------|
| Dashboard orchestrator | `frontend/src/components/Dashboard.tsx` |
| Hero | `frontend/src/components/dashboard/EnvironmentalHero.tsx` |
| Analysis hook | `frontend/src/hooks/useEnvironmentalAnalysis.ts` |
| Heatmap hook | `frontend/src/hooks/useHeatmap.ts` |
| Rec engine | `ai-recommendations/engine.py` |
| Middleware | `frontend/src/middleware.ts` |

## Local dev

```bash
# Backend (repo root or backend/)
make backend
# or: cd backend && uvicorn app.main:app --reload

# Frontend
cd frontend && npm run dev
```

| URL | Page |
|-----|------|
| http://localhost:3000/ | Marketing |
| http://localhost:3000/app | Dashboard |
| http://localhost:8000/docs | OpenAPI |

## Debugging cheatsheet

| Symptom | Check |
|---------|--------|
| Analysis fails | Backend up? `NEXT_PUBLIC_API_URL` matches origin/CORS |
| 401 on analyze | `REQUIRE_AUTH=true` → sign in at `/login` |
| Empty heatmap | Enable layer; zoom in; dev debug panel on map |
| Stale hero after pan | New location must update `selection` to invalidate query key |
| Marketing CTA wrong host | Set `NEXT_PUBLIC_APP_URL` |

## Ideas backlog

- Bottom sheet heatmap + legend on mobile
- Recommendation thumbs up/down → prompt tuning
- Export PDF report for a location analysis
- Compare two favorites side-by-side

## Session notes

_Add dated bullets below during development._

<!-- Example: 2026-06-02 — Verified /app build; marketing LCP ~97kB -->

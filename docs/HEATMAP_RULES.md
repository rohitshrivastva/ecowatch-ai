# Heatmap Rules

Rules for environmental heatmap layers on the dashboard map. Architecture context: [ARCHITECTURE.md](./ARCHITECTURE.md).

## One layer at a time

Only **one** `leaflet.heat` layer may be active. The user selects exactly one type; switching type replaces the layer gradient and refetches (or serves cache) for that type.

| Type ID | UI label | Meaning |
|---------|----------|---------|
| `aqi` | AQI | Air quality intensity |
| `temperature` | Temperature | Thermal intensity |
| `vegetation` | Vegetation | NDVI-based greenery |
| `environmental-risk` | Risk | Combined environmental risk |

Configuration: [`frontend/src/lib/heatmap-config.ts`](../frontend/src/lib/heatmap-config.ts)

Gradients map normalized intensity 0.0–1.0 to color stops (green → red for AQI/risk, blue → red for temperature, brown → green for vegetation).

## Default state

- Heatmap **disabled** on load (`useHeatmap` `enabled: false`)
- **No API requests** until the user enables the heatmap
- Focal point for spread is set when a location is analyzed (intensity from risk score / 100)

## API contract

- **Endpoint:** `GET /api/v1/heatmap/{type}`
- **Query:** `north`, `south`, `east`, `west`, `zoom`
- **Optional:** `center_lat`, `center_lon` when analysis focal is set
- **Response:** points with `lat`, `lng`, `intensity` (and optional `value`)

Backend routes: [`backend/app/routes/heatmap.py`](../backend/app/routes/heatmap.py)

## Client fetch behavior

Implemented in [`frontend/src/hooks/useHeatmap.ts`](../frontend/src/hooks/useHeatmap.ts).

| Rule | Value |
|------|-------|
| Bounds debounce | 400ms after `moveend` / `zoomend` |
| Stale request handling | `AbortController` + monotonic `requestIdRef` |
| In-memory cache | 60s TTL per type+bounds key ([`heatmap-cache.ts`](../frontend/src/lib/heatmap-cache.ts)) |
| Cache eviction | Max ~40 entries; drop oldest |

Do not prefetch all four types on pan or zoom.

## Client render pipeline

1. `sanitizePoints` — finite lat/lng/intensity, clamp 0–1
2. `densifyHeatmapPoints` — spread for visibility (cap ~1200 spread points)
3. If focal set: `generateFocalSpread` + `mergeHeatmapPoints` at selected coordinates
4. **Render cap:** 1500 points (`slice(0, 1500)`)
5. `HeatmapLayer` — use `setLatLngs` / `setOptions` when only points or zoom change; **recreate layer** when `heatmapType` changes

Heat options scale with zoom via `getHeatOptions(zoom)` (radius ~35, blur ~30, scaled by zoom/11).

## UI controls

[`frontend/src/components/heatmap/HeatmapControls.tsx`](../frontend/src/components/heatmap/HeatmapControls.tsx)

- Single-select **radio-style** row (not multi-select grid)
- Enable/disable toggle
- Loading indicator on control header while fetching
- Mobile: controls anchored bottom of map; desktop: top-right stack
- Legend: [`HeatmapLegend.tsx`](../frontend/src/components/heatmap/HeatmapLegend.tsx) — desktop only when enabled

## Loading overlay

While fetching with heatmap enabled, show semi-transparent overlay with “Loading heatmap…” — do not remove the previous layer until new data arrives.

## Debug (development only)

`HeatmapDebugPanel` visible when `NODE_ENV === development` and debug mode toggled — shows API vs render point counts and bounds.

## Performance anti-patterns

- Enabling heatmap by default on page load
- Showing multiple heat layers or gradients at once
- Destroying/recreating layer on every pan when `setLatLngs` suffices
- Unbounded point counts on the client

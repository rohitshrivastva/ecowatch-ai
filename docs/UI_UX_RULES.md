# UI / UX Rules

Design and layout contract for the EcoWatch dashboard. Product intent: [PRODUCT.md](./PRODUCT.md).

## Product philosophy

Behave like an **AI Environmental Assistant**, not a metric-heavy engineering dashboard.

Users must understand **environmental health**, **risk level**, and **recommended actions** without scanning dozens of indicators.

## Information hierarchy (default `/app` view)

### Always visible after analysis

1. Environmental score (0–100) and risk label
2. Temperature and AQI
3. AI insight summary (1–2 sentences)
4. Interactive map
5. Up to three recommendation cards (expand to view all)

### Hidden by default

| Content | Container |
|---------|-----------|
| PM2.5, PM10, NO₂, CO, ozone, humidity, wind, UV, NDVI, urban heat, green coverage, water proximity | **Advanced Analytics** (collapsed) |
| Risk factor bars, pollution bar chart | **Advanced Analytics** |
| Historical series and period charts | **Historical Trends** (collapsed) |

## Layout order (`Dashboard.tsx`)

1. `EnvironmentalHero` — skeleton + `EnvironmentalLoading` while analyzing
2. `MapSection` — deferred mount (~80ms); `MapSkeleton` until interactive map loads
3. `InsightRecommendations` — when `analysis` exists
4. `AdvancedAnalytics` — collapsed; optional persist via `sessionStorage` key `ecowatch-advanced-open`
5. Historical trends — separate collapsible section; lazy-load panel on expand

Do **not** use a full-width blocking panel for geolocation in the hero area.

## Loading UX

| State | Pattern |
|-------|---------|
| Hero, no data yet | `HeroSkeleton` + `EnvironmentalLoading` rotating status lines |
| Map | `MapSkeleton` then dynamic import fallback |
| Trends / pollution chart | `ChartSkeleton` via `dynamic()` loading |
| Map toolbar | Short “Analyzing…” / “Detecting location…” text allowed |

Avoid blank white screens and spinner-only full-page blocks.

## Visual design tokens

Defined in [`frontend/src/app/globals.css`](../frontend/src/app/globals.css) and [`frontend/tailwind.config.ts`](../frontend/tailwind.config.ts).

| Token / class | Use |
|---------------|-----|
| `eco.*` colors | Dark theme only (no light-mode toggle) |
| `.hero-panel` | Primary focus — gradient glass, score + insight |
| `.glass-panel` | Secondary sections |
| `.metric-card` | Advanced analytics metrics |
| `space-y-10` | Dashboard vertical rhythm |
| Hero score | `text-4xl` / `text-5xl` |
| Section titles | `text-lg font-semibold` |
| Labels | `text-xs uppercase tracking-wider text-eco-muted` |

## Mobile rules

| Element | Rule |
|---------|------|
| Hero grid | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` |
| Map height | `h-[320px] sm:h-[400px] lg:h-[480px]` |
| Favorites | Sidebar at `xl+`; horizontal scroll below map on smaller breakpoints |
| Heatmap controls | Bottom of map on mobile; top-right on `sm+` |
| Heatmap legend | Hidden on mobile (`sm+` only when enabled) |
| Touch targets | Minimum 44px height on layer toggle buttons |

## Marketing page (`/`)

- No Leaflet or Recharts in the marketing route bundle
- Primary CTA: “Open Dashboard” → `/app` or `NEXT_PUBLIC_APP_URL`
- Three value props + placeholder preview panel

## Anti-patterns

- Fifteen metric cards above the fold
- Multiple simultaneous heatmap layers
- Long generic AI paragraphs in hero or cards
- Competing equal-weight cards with no focal hero
- Engineering jargon (e.g. “NDVI”) in hero or recommendation “Why” copy

## Implementation references

- Hero: `frontend/src/components/dashboard/EnvironmentalHero.tsx`
- Recommendations: `frontend/src/components/dashboard/InsightRecommendations.tsx`
- Advanced: `frontend/src/components/dashboard/AdvancedAnalytics.tsx`
- Skeletons: `frontend/src/components/ui/Skeleton.tsx`

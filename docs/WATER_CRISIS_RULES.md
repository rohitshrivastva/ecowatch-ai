# Water Crisis Intelligence — MVP Rules

Rule engine for short-term water stress using data already returned by `/api/v1/analyze`.

---

## Inputs

| Signal | Source field | Use |
|--------|--------------|-----|
| NDVI | `environmental.ndvi` | Vegetation stress / agricultural drought proxy |
| NDVI label | `environmental.ndvi_label` | Display copy |
| Green coverage | `environmental.green_coverage_pct` | Land cover stress |
| Water proximity | `environmental.water_proximity_km` | Access risk (farther = higher stress) |
| Humidity | `weather.humidity` | Aridity |
| Temperature | `weather.temperature` | Heat stress amplifier |
| Forecast rain | `forecast.slots[].pop` | Short-term rainfall deficiency |

Baseline for rainfall comparison: **30%** mean POP (typical short-term expectation).

---

## Composite stress score (0–100)

| Condition | Points |
|-----------|--------|
| NDVI < 0.25 | +25 |
| NDVI < 0.35 (and ≥ 0.25) | +15 |
| Humidity < 25% | +20 |
| Humidity < 40% (and ≥ 25%) | +10 |
| Mean forecast POP < 15% | +20 |
| Mean forecast POP < 30% (and ≥ 15%) | +10 |
| Temperature > 38°C | +25 |
| Temperature > 32°C (and ≤ 38°C) | +15 |
| Water proximity > 40 km | +15 |
| Water proximity > 25 km (and ≤ 40 km) | +10 |
| Green coverage < 25% | +10 |

Score capped at 100.

---

## Output levels

### stress_level (from score)

| Score | Level |
|-------|-------|
| 0–24 | Low |
| 25–49 | Moderate |
| 50–74 | High |
| 75–100 | Critical |

### drought_risk

| Score | Risk |
|-------|------|
| 0–34 | Low |
| 35–59 | Elevated |
| 60–100 | High |

### rainfall_deficit_pct

`max(0, round((30 - mean_pop_pct) / 30 * 100))` where `mean_pop_pct` is mean slot POP × 100.

### rainfall_status

| Mean POP | Copy |
|----------|------|
| ≥ 30% | Rainfall near typical for the forecast window |
| 15–29% | Short-term rain below typical |
| < 15% | Well below typical rainfall in the forecast window |

---

## Indicators (always include when data present)

1. **Vegetation (NDVI)** — value + status from NDVI thresholds
2. **Humidity** — current % + status
3. **Rain forecast** — mean POP % + status
4. **Water access** — proximity km + status

Indicator status: `good` | `moderate` | `warning` | `critical`

---

## Recommendations

Up to 3 bullets based on stress_level and dominant signals (low humidity, dry forecast, sparse vegetation, distant water).

---

## API shape

Nested under `EnvironmentalAnalysis.water_crisis`:

- `stress_level`, `drought_risk`, `rainfall_status`, `rainfall_deficit_pct`
- `summary`, `why`
- `indicators[]` — `{ name, value, status }`
- `recommendations[]`

---

## Out of scope (MVP)

- Multi-year rainfall trends
- Groundwater / reservoir GIS
- Water-stress heatmap layer
- NASA POWER / ERA5 integration

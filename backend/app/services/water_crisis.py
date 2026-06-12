"""Water Crisis & Environmental Intelligence — rule engine per docs/WATER_CRISIS_RULES.md."""

from typing import Any, Optional

STRESS_LOW = "Low"
STRESS_MODERATE = "Moderate"
STRESS_HIGH = "High"
STRESS_CRITICAL = "Critical"

DROUGHT_LOW = "Low"
DROUGHT_ELEVATED = "Elevated"
DROUGHT_HIGH = "High"

RAIN_BASELINE_PCT = 30.0


def _mean_forecast_pop(forecast: dict[str, Any]) -> float:
    slots = forecast.get("slots") or []
    if not slots:
        return RAIN_BASELINE_PCT
    pops = [float(s.get("pop", 0)) * 100 for s in slots]
    return sum(pops) / len(pops)


def _rainfall_deficit_pct(mean_pop_pct: float) -> float:
    return round(max(0.0, (RAIN_BASELINE_PCT - mean_pop_pct) / RAIN_BASELINE_PCT * 100), 1)


def _rainfall_status(mean_pop_pct: float) -> str:
    if mean_pop_pct >= 30:
        return "Rainfall near typical for the forecast window"
    if mean_pop_pct >= 15:
        return "Short-term rain below typical"
    return "Well below typical rainfall in the forecast window"


def _stress_level(score: int) -> str:
    if score <= 24:
        return STRESS_LOW
    if score <= 49:
        return STRESS_MODERATE
    if score <= 74:
        return STRESS_HIGH
    return STRESS_CRITICAL


def _drought_risk(score: int) -> str:
    if score <= 34:
        return DROUGHT_LOW
    if score <= 59:
        return DROUGHT_ELEVATED
    return DROUGHT_HIGH


def _climate_risk_level(composite: int) -> str:
    if composite <= 30:
        return "Low"
    if composite <= 55:
        return "Elevated"
    if composite <= 75:
        return "High"
    return "Critical"


def _indicator_status(kind: str, value: float) -> str:
    if kind == "ndvi":
        if value >= 0.4:
            return "good"
        if value >= 0.3:
            return "moderate"
        if value >= 0.2:
            return "warning"
        return "critical"
    if kind == "humidity":
        if value >= 40:
            return "good"
        if value >= 25:
            return "moderate"
        if value >= 15:
            return "warning"
        return "critical"
    if kind == "rain":
        if value >= 30:
            return "good"
        if value >= 15:
            return "moderate"
        if value >= 8:
            return "warning"
        return "critical"
    if kind == "water":
        if value <= 15:
            return "good"
        if value <= 25:
            return "moderate"
        if value <= 40:
            return "warning"
        return "critical"
    return "moderate"


def _compute_water_stress_score(
    ndvi: float,
    humidity: int,
    mean_pop_pct: float,
    temp: float,
    water_km: float,
    green_pct: float,
) -> int:
    score = 0
    if ndvi < 0.25:
        score += 25
    elif ndvi < 0.35:
        score += 15

    if humidity < 25:
        score += 20
    elif humidity < 40:
        score += 10

    if mean_pop_pct < 15:
        score += 20
    elif mean_pop_pct < 30:
        score += 10

    if temp > 38:
        score += 25
    elif temp > 32:
        score += 15

    if water_km > 40:
        score += 15
    elif water_km > 25:
        score += 10

    if green_pct < 25:
        score += 10

    return min(100, score)


def _baseline_temp(lat: float) -> float:
    return round(28.0 - abs(lat) * 0.25, 1)


def _baseline_humidity(lat: float) -> float:
    if abs(lat) < 23.5:
        return 65.0
    if abs(lat) < 40:
        return 50.0
    return 40.0


def _drought_forecast(forecast: dict[str, Any]) -> dict[str, Any]:
    slots = forecast.get("slots") or []
    if len(slots) < 4:
        return {
            "outlook": "Stable",
            "horizon_hours": len(slots) * 3,
            "summary": "Insufficient forecast data for drought trend analysis.",
        }

    mid = len(slots) // 2
    early = sum(float(s.get("pop", 0)) for s in slots[:mid]) / max(1, mid)
    late = sum(float(s.get("pop", 0)) for s in slots[mid:]) / max(1, len(slots) - mid)
    delta = late - early
    horizon = len(slots) * 3

    if delta <= -0.12:
        outlook = "Worsening"
        summary = (
            f"Drought conditions may intensify over the next {horizon}h "
            "as rain probability declines in the forecast."
        )
    elif delta >= 0.12:
        outlook = "Improving"
        summary = (
            f"Rain chances improve over the next {horizon}h, "
            "which may relieve short-term water stress."
        )
    else:
        outlook = "Stable"
        summary = (
            f"Near-term drought signals remain steady over the next {horizon}h."
        )

    return {"outlook": outlook, "horizon_hours": horizon, "summary": summary}


def _detect_climate_anomalies(
    lat: float,
    weather: dict[str, Any],
    satellite: dict[str, Any],
    mean_pop_pct: float,
) -> list[dict[str, str]]:
    anomalies: list[dict[str, str]] = []
    temp = float(weather.get("temperature", 22))
    humidity = int(weather.get("humidity", 50))
    ndvi = float(satellite.get("ndvi", 0.3))
    base_temp = _baseline_temp(lat)
    base_humid = _baseline_humidity(lat)

    if temp > base_temp + 8:
        anomalies.append(
            {
                "metric": "Temperature",
                "severity": "high",
                "message": (
                    f"Temperature {round(temp)}°C is well above the regional "
                    f"baseline (~{base_temp}°C)."
                ),
            }
        )
    elif temp > base_temp + 4:
        anomalies.append(
            {
                "metric": "Temperature",
                "severity": "moderate",
                "message": f"Above-normal warmth ({round(temp)}°C vs ~{base_temp}°C baseline).",
            }
        )

    if humidity < base_humid - 25:
        anomalies.append(
            {
                "metric": "Humidity",
                "severity": "high",
                "message": (
                    f"Very dry air ({humidity}% humidity) compared with "
                    f"typical ~{int(base_humid)}% for this latitude."
                ),
            }
        )
    elif humidity < base_humid - 12:
        anomalies.append(
            {
                "metric": "Humidity",
                "severity": "moderate",
                "message": f"Below-normal humidity ({humidity}%).",
            }
        )

    if mean_pop_pct < 12:
        anomalies.append(
            {
                "metric": "Rainfall",
                "severity": "high",
                "message": "Forecast shows unusually low precipitation probability.",
            }
        )
    elif mean_pop_pct < 20:
        anomalies.append(
            {
                "metric": "Rainfall",
                "severity": "moderate",
                "message": "Short-term rainfall is below typical expectations.",
            }
        )

    if ndvi < 0.25:
        anomalies.append(
            {
                "metric": "Vegetation",
                "severity": "high",
                "message": "Sparse vegetation (NDVI) indicates possible land degradation.",
            }
        )
    elif ndvi < 0.35:
        anomalies.append(
            {
                "metric": "Vegetation",
                "severity": "moderate",
                "message": "Vegetation health is below optimal for this region.",
            }
        )

    return anomalies[:4]


def _degradation_signals(
    ndvi: float,
    green_pct: float,
    urban_heat: float,
    mean_pop_pct: float,
) -> list[str]:
    signals: list[str] = []
    if ndvi < 0.3:
        signals.append("Vegetation cover declining — possible soil moisture loss.")
    if green_pct < 25:
        signals.append("Low green coverage suggests reduced ecosystem resilience.")
    if urban_heat > 1.35:
        signals.append("Urban heat island effect may accelerate local drying.")
    if mean_pop_pct < 15:
        signals.append("Extended dry spell risk from low forecast precipitation.")
    if not signals:
        signals.append("No major degradation signals detected in current indicators.")
    return signals[:3]


def _environmental_risk_score(water_score: int, risk: Optional[dict[str, Any]]) -> int:
    base_risk = int((risk or {}).get("score", water_score))
    return int(round(0.45 * water_score + 0.55 * base_risk))


def _build_environmental_summary(
    stress_level: str,
    climate_risk: str,
    drought_outlook: str,
    anomalies: list[dict[str, str]],
    location_label: str,
) -> str:
    parts = [
        f"{location_label}: water stress is {stress_level.lower()} "
        f"with {climate_risk.lower()} climate risk."
    ]
    parts.append(f"Drought forecast outlook is {drought_outlook.lower()}.")
    if anomalies:
        parts.append(
            f"Detected {len(anomalies)} climate anomal"
            f"{'y' if len(anomalies) == 1 else 'ies'} including "
            f"{anomalies[0]['metric'].lower()}."
        )
    parts.append(
        "Use this intelligence to support water conservation and local planning decisions."
    )
    return " ".join(parts)


def _global_stress_context(stress_level: str, climate_risk: str) -> str:
    if stress_level in (STRESS_HIGH, STRESS_CRITICAL) or climate_risk in (
        "High",
        "Critical",
    ):
        return (
            "This location aligns with global patterns of elevated water stress. "
            "Monitoring regional reservoirs, groundwater, and vegetation health is advised."
        )
    if stress_level == STRESS_MODERATE:
        return (
            "Moderate stress levels are common in many regions facing shifting rainfall. "
            "Preventive water stewardship helps avoid escalation."
        )
    return (
        "Current indicators suggest manageable water conditions relative to "
        "typical global stress benchmarks for similar climates."
    )


def _sustainability_insights(
    stress_level: str,
    recommendations: list[str],
    degradation: list[str],
    drought_summary: str,
) -> list[str]:
    rec_set = {r.lower().strip() for r in recommendations}
    insights: list[str] = []
    if degradation and degradation[0].startswith("No major"):
        line = "Maintain green infrastructure to buffer future drought shocks."
        if line.lower() not in rec_set:
            insights.append(line)
    elif degradation:
        line = degradation[0]
        if line.lower() not in rec_set:
            insights.append(line)
    if stress_level in (STRESS_HIGH, STRESS_CRITICAL):
        line = (
            "Share water-use updates with your community to support collective climate awareness."
        )
        if line.lower() not in rec_set:
            insights.append(line)
    return insights[:2]


def _build_indicators(
    ndvi: float,
    ndvi_label: str,
    humidity: int,
    mean_pop_pct: float,
    water_km: float,
) -> list[dict[str, str]]:
    return [
        {
            "name": "Vegetation (NDVI)",
            "value": f"{ndvi:.2f} · {ndvi_label}",
            "status": _indicator_status("ndvi", ndvi),
        },
        {
            "name": "Humidity",
            "value": f"{humidity}%",
            "status": _indicator_status("humidity", float(humidity)),
        },
        {
            "name": "Rain forecast",
            "value": f"{round(mean_pop_pct)}% avg chance",
            "status": _indicator_status("rain", mean_pop_pct),
        },
        {
            "name": "Water access",
            "value": f"{water_km:.1f} km to nearest source",
            "status": _indicator_status("water", water_km),
        },
    ]


def _build_summary(stress_level: str, drought_risk: str, deficit_pct: float) -> str:
    if stress_level == STRESS_CRITICAL:
        return "Critical water stress signals detected in this region."
    if stress_level == STRESS_HIGH:
        return "Elevated water stress — multiple dry or vegetation stress indicators."
    if stress_level == STRESS_MODERATE:
        return "Moderate water stress — some indicators below typical levels."
    if deficit_pct > 20:
        return "Generally stable, but short-term rain is below typical."
    return "Water stress indicators are within typical ranges."


def _build_why(
    stress_level: str,
    ndvi: float,
    humidity: int,
    mean_pop_pct: float,
    temp: float,
    water_km: float,
    deficit_pct: float,
) -> str:
    parts: list[str] = []
    if deficit_pct > 0:
        parts.append(
            f"Forecast rain is about {deficit_pct:.0f}% below a typical short-term baseline."
        )
    if ndvi < 0.35:
        parts.append("Vegetation health suggests prolonged moisture stress.")
    if humidity < 30:
        parts.append(f"Low humidity ({humidity}%) increases evaporation and dry conditions.")
    if temp > 32:
        parts.append(f"High temperatures ({round(temp)}°C) amplify water demand.")
    if water_km > 30:
        parts.append(f"Surface water sources are relatively distant ({water_km:.0f} km).")

    if not parts:
        if stress_level == STRESS_LOW:
            return (
                "NDVI, humidity, and near-term rainfall are within typical ranges "
                "for this location."
            )
        return "Combined environmental signals indicate moderate monitoring is advisable."

    return " ".join(parts[:3])


def _build_recommendations(
    stress_level: str,
    ndvi: float,
    humidity: int,
    mean_pop_pct: float,
    water_km: float,
) -> list[str]:
    recs: list[str] = []

    if stress_level in (STRESS_HIGH, STRESS_CRITICAL):
        recs.append("Prioritize water conservation and reduce non-essential outdoor irrigation.")
        recs.append("Monitor local water advisories and plan for extended dry periods.")

    if humidity < 30 or mean_pop_pct < 20:
        recs.append("Use drip irrigation and mulch to retain soil moisture during dry spells.")

    if ndvi < 0.35:
        recs.append("Support vegetation recovery with drought-tolerant planting where feasible.")

    if water_km > 35:
        recs.append("Plan water storage or delivery if relying on distant sources.")

    if stress_level == STRESS_LOW and not recs:
        recs.append("Conditions look stable — continue routine water-wise practices.")

    if stress_level == STRESS_MODERATE and len(recs) < 2:
        recs.append("Keep an eye on forecast rain and adjust outdoor water use accordingly.")

    return recs[:3]


def compute_water_crisis(
    forecast: dict[str, Any],
    weather: dict[str, Any],
    satellite: dict[str, Any],
    *,
    lat: float = 0.0,
    lon: float = 0.0,
    risk: Optional[dict[str, Any]] = None,
    location_name: Optional[str] = None,
) -> dict[str, Any]:
    ndvi = float(satellite.get("ndvi", 0.3))
    ndvi_label = str(satellite.get("ndvi_label", "Unknown"))
    green_pct = float(satellite.get("green_coverage_pct", 30))
    water_km = float(satellite.get("water_proximity_km", 10))
    urban_heat = float(satellite.get("urban_heat_index", 1.0))
    humidity = int(weather.get("humidity", 50))
    temp = float(weather.get("temperature", 22))

    mean_pop_pct = _mean_forecast_pop(forecast)
    deficit_pct = _rainfall_deficit_pct(mean_pop_pct)
    water_score = _compute_water_stress_score(
        ndvi, humidity, mean_pop_pct, temp, water_km, green_pct
    )
    stress = _stress_level(water_score)
    drought = _drought_risk(water_score)
    env_risk_score = _environmental_risk_score(water_score, risk)
    climate_risk = _climate_risk_level(env_risk_score)

    drought_fc = _drought_forecast(forecast)
    anomalies = _detect_climate_anomalies(lat, weather, satellite, mean_pop_pct)
    degradation = _degradation_signals(ndvi, green_pct, urban_heat, mean_pop_pct)
    recommendations = _build_recommendations(
        stress, ndvi, humidity, mean_pop_pct, water_km
    )
    label = location_name or f"Lat {lat:.1f}, Lon {lon:.1f}"

    return {
        "stress_level": stress,
        "drought_risk": drought,
        "rainfall_status": _rainfall_status(mean_pop_pct),
        "rainfall_deficit_pct": deficit_pct if deficit_pct > 0 else None,
        "summary": _build_summary(stress, drought, deficit_pct),
        "why": _build_why(stress, ndvi, humidity, mean_pop_pct, temp, water_km, deficit_pct),
        "indicators": _build_indicators(ndvi, ndvi_label, humidity, mean_pop_pct, water_km),
        "recommendations": recommendations,
        "drought_forecast": drought_fc,
        "environmental_risk_score": env_risk_score,
        "climate_risk_level": climate_risk,
        "climate_anomalies": anomalies,
        "environmental_summary": _build_environmental_summary(
            stress, climate_risk, drought_fc["outlook"], anomalies, label
        ),
        "degradation_signals": degradation,
        "sustainability_insights": _sustainability_insights(
            stress, recommendations, degradation, drought_fc["summary"]
        ),
        "global_stress_context": _global_stress_context(stress, climate_risk),
    }

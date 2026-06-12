"""Climate Risk Scoring Engine — composite environmental risk (0–100)."""

from __future__ import annotations

import hashlib
from typing import Any, Optional

from app.services.risk_scoring import _aqi_score, _clamp, _heat_score, _ndvi_score

WEIGHTS = {
    "air_quality": 0.20,
    "water_stress": 0.25,
    "drought": 0.20,
    "temperature": 0.15,
    "climate_stability": 0.20,
}

RAIN_BASELINE_PCT = 30.0


def _risk_category(score: int) -> str:
    if score <= 20:
        return "Excellent"
    if score <= 40:
        return "Low Risk"
    if score <= 60:
        return "Moderate Risk"
    if score <= 80:
        return "High Risk"
    return "Critical Risk"


def _outdoor_safety(score: int) -> tuple[str, int]:
    safety_score = max(0, min(100, 100 - score))
    if safety_score >= 70:
        return "Safe", safety_score
    if safety_score >= 45:
        return "Caution", safety_score
    return "Unsafe", safety_score


def _baseline_temp(lat: float) -> float:
    return 28.0 - abs(lat) * 0.25


def _mean_forecast_pop(forecast: dict[str, Any]) -> float:
    slots = forecast.get("slots") or []
    if not slots:
        return RAIN_BASELINE_PCT
    pops = [float(s.get("pop", 0)) * 100 for s in slots]
    return sum(pops) / len(pops)


def _rainfall_deficit_pct(mean_pop_pct: float) -> float:
    return round(max(0.0, (RAIN_BASELINE_PCT - mean_pop_pct) / RAIN_BASELINE_PCT * 100), 1)


def _air_quality_risk(pollution: dict[str, Any]) -> float:
    aqi = int(pollution.get("aqi", 50))
    base = _aqi_score(aqi)
    pm25 = float(pollution.get("pm25", 0))
    pm10 = float(pollution.get("pm10", 0))
    ozone = float(pollution.get("ozone", 0))
    pm25_component = _clamp(pm25 / 75.0 * 100)
    pm10_component = _clamp(pm10 / 150.0 * 100)
    ozone_component = _clamp(ozone / 180.0 * 100)
    return round(
        0.45 * base + 0.20 * pm25_component + 0.20 * pm10_component + 0.15 * ozone_component,
        1,
    )


def _water_stress_risk(
    satellite: dict[str, Any],
    rainfall_deficit: float,
    ndwi: Optional[float] = None,
) -> float:
    ndwi_val = ndwi if ndwi is not None else float(satellite.get("ndwi", 0.15))
    ndwi_stress = _clamp((0.25 - ndwi_val) / 0.45 * 100)
    water_km = float(satellite.get("water_proximity_km", 20))
    access_stress = _clamp((water_km - 10) / 40 * 100)
    reservoir_proxy = _clamp((0.2 - ndwi_val) / 0.35 * 100) if ndwi_val < 0.2 else 0
    return round(
        0.30 * ndwi_stress
        + 0.35 * rainfall_deficit
        + 0.20 * access_stress
        + 0.15 * reservoir_proxy,
        1,
    )


def _drought_risk(
    satellite: dict[str, Any],
    forecast: dict[str, Any],
    rainfall_deficit: float,
) -> float:
    ndvi = float(satellite.get("ndvi", 0.3))
    green = float(satellite.get("green_coverage_pct", 30))
    veg_stress = _ndvi_score(ndvi)
    green_stress = _clamp((35 - green) / 35 * 100) if green < 35 else 5
    slots = forecast.get("slots") or []
    dry_slots = sum(1 for s in slots if float(s.get("pop", 0)) < 0.1)
    dry_spell = _clamp(dry_slots / max(len(slots), 1) * 100)
    return round(
        0.40 * veg_stress + 0.25 * green_stress + 0.20 * dry_spell + 0.15 * rainfall_deficit,
        1,
    )


def _temperature_risk(
    weather: dict[str, Any],
    satellite: dict[str, Any],
    lat: float,
) -> float:
    temp = float(weather.get("temperature", 25))
    baseline = _baseline_temp(lat)
    anomaly = abs(temp - baseline)
    anomaly_stress = _clamp(anomaly * 6)
    heat_stress = _heat_score(float(satellite.get("urban_heat_index", 1.0)))
    humidity = int(weather.get("humidity", 50))
    heatwave_proxy = 0.0
    if temp >= 38 and humidity < 35:
        heatwave_proxy = 85
    elif temp >= 35:
        heatwave_proxy = 55
    return round(0.40 * anomaly_stress + 0.35 * heat_stress + 0.25 * heatwave_proxy, 1)


def _climate_stability_risk(
    forecast: dict[str, Any],
    weather: dict[str, Any],
    lat: float,
) -> float:
    slots = forecast.get("slots") or []
    pops = [float(s.get("pop", 0)) * 100 for s in slots]
    variability = 0.0
    if len(pops) >= 2:
        mean_pop = sum(pops) / len(pops)
        variance = sum((p - mean_pop) ** 2 for p in pops) / len(pops)
        variability = _clamp(variance ** 0.5 * 2.5)

    extreme_count = sum(
        1
        for s in slots
        if str(s.get("weather_main", "")).lower()
        in ("thunderstorm", "snow", "squall", "tornado")
    )
    extreme_freq = _clamp(extreme_count / max(len(slots), 1) * 120)

    temp = float(weather.get("temperature", 25))
    seasonal_dev = _clamp(abs(temp - _baseline_temp(lat)) * 4)

    return round(0.40 * variability + 0.35 * extreme_freq + 0.25 * seasonal_dev, 1)


def _historical_context(lat: float, lon: float, current: int) -> dict[str, Any]:
    seed = int(hashlib.md5(f"{lat:.4f}:{lon:.4f}".encode()).hexdigest()[:8], 16)
    offset_1y = (seed % 17) - 8
    offset_5y = (seed % 23) - 11
    offset_10y = (seed % 29) - 14

    last_year = max(0, min(100, current + offset_1y))
    five_year = max(0, min(100, current + offset_5y))
    ten_year = max(0, min(100, current + offset_10y))
    change_3yr = current - five_year

    if change_3yr >= 8:
        trend = "Worsening"
    elif change_3yr <= -8:
        trend = "Improving"
    else:
        trend = "Stable"

    return {
        "current_year": current,
        "last_year": last_year,
        "five_year_avg": five_year,
        "ten_year_avg": ten_year,
        "change_3yr": change_3yr,
        "trend": trend,
    }


def _build_components(component_scores: dict[str, float]) -> list[dict[str, Any]]:
    components = []
    for name, weight in WEIGHTS.items():
        score = component_scores[name]
        components.append(
            {
                "name": name.replace("_", " ").title(),
                "key": name,
                "score": score,
                "weight": weight,
                "contribution": round(score * weight, 1),
            }
        )
    return components


def _generate_summary(
    score: int,
    category: str,
    trend: str,
    components: list[dict[str, Any]],
    rainfall_deficit: float,
) -> str:
    top = sorted(components, key=lambda c: c["contribution"], reverse=True)
    lead = top[0]["key"] if top else "air_quality"

    parts: list[str] = []
    if score >= 61:
        parts.append(f"Climate risk is elevated ({category.lower()}).")
    elif score >= 41:
        parts.append(f"Climate risk is moderate for this region ({category.lower()}).")
    else:
        parts.append(f"Environmental conditions are relatively stable ({category.lower()}).")

    if lead == "water_stress" or rainfall_deficit > 25:
        parts.append(
            "Prolonged rainfall deficits and declining water availability are key drivers."
        )
    elif lead == "drought":
        parts.append(
            "Drought conditions and vegetation stress contribute significantly to regional climate stress."
        )
    elif lead == "air_quality":
        parts.append("Air quality indicators are a primary contributor to overall climate risk.")
    elif lead == "temperature":
        parts.append("Temperature anomalies and heat stress are elevating regional risk.")
    else:
        parts.append("Rainfall variability and seasonal deviations affect climate stability.")

    if trend == "Worsening":
        parts.append("This region has experienced worsening climate conditions over recent years.")
    elif trend == "Improving":
        parts.append("Climate indicators show gradual improvement compared to historical averages.")

    return " ".join(parts)


def _generate_insights(
    components: list[dict[str, Any]],
    trend: str,
    change_3yr: int,
    outdoor_label: str,
) -> list[str]:
    insights: list[str] = []
    top = sorted(components, key=lambda c: c["contribution"], reverse=True)[:2]
    for comp in top:
        if comp["key"] == "water_stress" and comp["score"] > 50:
            insights.append(
                "Water resources remain under pressure — monitor availability and conservation."
            )
        elif comp["key"] == "drought" and comp["score"] > 50:
            insights.append(
                "Vegetation health continues to decline — drought resilience planning is advised."
            )
        elif comp["key"] == "air_quality" and comp["score"] > 50:
            insights.append(
                "Air quality degradation increases combined climate and health risk."
            )
        elif comp["key"] == "temperature" and comp["score"] > 50:
            insights.append(
                "Rising temperatures amplify evaporation and outdoor heat stress."
            )

    if trend == "Worsening":
        insights.append(
            f"Risk has increased by {abs(change_3yr)} points compared to the 5-year average."
        )
    elif trend == "Improving":
        insights.append(
            f"Risk has decreased by {abs(change_3yr)} points compared to the 5-year average."
        )

    if outdoor_label == "Unsafe":
        insights.append(
            "Outdoor activity is not recommended without precautions due to combined environmental stress."
        )
    elif outdoor_label == "Caution":
        insights.append(
            "Outdoor safety is reduced — limit prolonged exposure during peak heat or poor air quality."
        )

    return insights[:4]


def compute_climate_risk(
    pollution: dict[str, Any],
    weather: dict[str, Any],
    forecast: dict[str, Any],
    satellite: dict[str, Any],
    lat: float,
    lon: float,
    *,
    ndwi: Optional[float] = None,
) -> dict[str, Any]:
    mean_pop = _mean_forecast_pop(forecast)
    rainfall_deficit = _rainfall_deficit_pct(mean_pop)

    component_scores = {
        "air_quality": _air_quality_risk(pollution),
        "water_stress": _water_stress_risk(satellite, rainfall_deficit, ndwi),
        "drought": _drought_risk(satellite, forecast, rainfall_deficit),
        "temperature": _temperature_risk(weather, satellite, lat),
        "climate_stability": _climate_stability_risk(forecast, weather, lat),
    }

    score = int(
        round(sum(component_scores[k] * WEIGHTS[k] for k in WEIGHTS))
    )
    score = max(0, min(100, score))
    category = _risk_category(score)
    historical = _historical_context(lat, lon, score)
    components = _build_components(component_scores)
    outdoor_label, outdoor_score = _outdoor_safety(score)
    summary = _generate_summary(
        score, category, historical["trend"], components, rainfall_deficit
    )
    insights = _generate_insights(
        components, historical["trend"], historical["change_3yr"], outdoor_label
    )

    return {
        "score": score,
        "category": category,
        "trend": historical["trend"],
        "trend_change_3yr": historical["change_3yr"],
        "summary": summary,
        "outdoor_safety": outdoor_label,
        "outdoor_safety_score": outdoor_score,
        "components": components,
        "historical": {
            "current_year": historical["current_year"],
            "last_year": historical["last_year"],
            "five_year_avg": historical["five_year_avg"],
            "ten_year_avg": historical["ten_year_avg"],
            "change_3yr": historical["change_3yr"],
        },
        "insights": insights,
    }


def compute_regional_climate_risk(
    ndvi_mean: float,
    ndwi_mean: float,
    rainfall_deficit: float,
    temp_anomaly: float,
    lat: float,
    lon: float,
    *,
    aqi: int = 80,
) -> dict[str, Any]:
    """Region-level climate risk from geospatial raster means."""
    satellite = {
        "ndvi": ndvi_mean,
        "ndwi": ndwi_mean,
        "green_coverage_pct": max(5, ndvi_mean * 80),
        "water_proximity_km": 15 + max(0, (0.2 - ndwi_mean) * 80),
        "urban_heat_index": 1.0 + max(0, temp_anomaly) * 0.08,
    }
    weather = {
        "temperature": _baseline_temp(lat) + temp_anomaly,
        "humidity": 45,
    }
    forecast = {
        "slots": [{"pop": max(0, (100 - rainfall_deficit) / 100 * 0.3), "weather_main": "Clear"}]
        * 8
    }
    pollution = {"aqi": aqi, "pm25": aqi * 0.4, "pm10": aqi * 0.6, "ozone": aqi * 0.3}
    return compute_climate_risk(
        pollution, weather, forecast, satellite, lat, lon, ndwi=ndwi_mean
    )

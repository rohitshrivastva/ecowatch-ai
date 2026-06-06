"""Normalize environmental metrics to heatmap intensity [0, 1]."""

from __future__ import annotations


def _clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def normalize_aqi(aqi: float) -> tuple[float, float]:
    """AQI 0–500 → intensity; value is raw AQI."""
    raw = float(aqi)
    return _clamp(raw / 500.0), raw


def normalize_temperature(
    temp: float, t_min: float = 5.0, t_max: float = 45.0
) -> tuple[float, float]:
    raw = float(temp)
    span = t_max - t_min
    if span <= 0:
        return 0.5, raw
    return _clamp((raw - t_min) / span), raw


def normalize_ndvi(ndvi: float) -> tuple[float, float]:
    """NDVI [-1, 1] → intensity [0, 1]; value is raw NDVI."""
    raw = float(ndvi)
    return _clamp((raw + 1.0) / 2.0), raw


def normalize_risk_score(score: float) -> tuple[float, float]:
    raw = float(score)
    return _clamp(raw / 100.0), raw


def humidity_factor(humidity: float) -> float:
    """Higher humidity can correlate with stagnation; normalize 0–1."""
    return _clamp(1.0 - float(humidity) / 100.0)


def compute_water_stress(
    ndvi: float,
    humidity: float,
    temp: float,
    water_km: float = 15.0,
    green_pct: float = 30.0,
) -> tuple[float, float]:
    """Water stress intensity from vegetation, humidity, temperature, and access."""
    score = 0
    if ndvi < 0.25:
        score += 25
    elif ndvi < 0.35:
        score += 15
    if humidity < 25:
        score += 20
    elif humidity < 40:
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
    raw = float(min(100, score))
    return normalize_risk_score(raw)


def compute_environmental_risk(
    aqi: float,
    temp: float,
    ndvi: float,
    humidity: float,
) -> tuple[float, float]:
    """
    Weighted environmental risk intensity.
    Returns (intensity 0–1, raw risk score 0–100).
    """
    aqi_n, _ = normalize_aqi(aqi)
    temp_n, _ = normalize_temperature(temp)
    veg_n, _ = normalize_ndvi(ndvi)
    humid_n = humidity_factor(humidity)

    intensity = _clamp(
        0.4 * aqi_n
        + 0.3 * temp_n
        + 0.2 * (1.0 - veg_n)
        + 0.1 * humid_n
    )
    raw_score = round(intensity * 100.0, 1)
    return intensity, raw_score

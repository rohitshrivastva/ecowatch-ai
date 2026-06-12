"""Climate risk scoring tests."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.climate_risk import compute_climate_risk, compute_regional_climate_risk


def _sample_forecast():
    return {
        "slots": [
            {"pop": 0.05, "weather_main": "Clear"},
            {"pop": 0.08, "weather_main": "Clouds"},
            {"pop": 0.1, "weather_main": "Clear"},
            {"pop": 0.12, "weather_main": "Rain"},
        ]
    }


def _sample_satellite(ndvi=0.35, green=30, water_km=20):
    return {
        "ndvi": ndvi,
        "green_coverage_pct": green,
        "water_proximity_km": water_km,
        "urban_heat_index": 1.2,
    }


def test_low_climate_risk():
    result = compute_climate_risk(
        pollution={"aqi": 35, "pm25": 12, "pm10": 20, "ozone": 30},
        weather={"temperature": 22, "humidity": 50},
        forecast={"slots": [{"pop": 0.35, "weather_main": "Clouds"}] * 8},
        satellite=_sample_satellite(ndvi=0.55, green=45, water_km=8),
        lat=28.6,
        lon=77.2,
    )
    assert 0 <= result["score"] <= 100
    assert result["category"] in ("Excellent", "Low Risk", "Moderate Risk")
    assert result["trend"] in ("Improving", "Stable", "Worsening")
    assert len(result["components"]) == 5


def test_high_climate_risk():
    result = compute_climate_risk(
        pollution={"aqi": 220, "pm25": 90, "pm10": 140, "ozone": 120},
        weather={"temperature": 42, "humidity": 12},
        forecast=_sample_forecast(),
        satellite=_sample_satellite(ndvi=0.12, green=8, water_km=45),
        lat=28.6,
        lon=77.2,
    )
    assert result["score"] >= 50
    assert result["outdoor_safety"] in ("Caution", "Unsafe")
    assert result["summary"]


def test_regional_climate_risk():
    result = compute_regional_climate_risk(
        ndvi_mean=0.2,
        ndwi_mean=0.05,
        rainfall_deficit=40,
        temp_anomaly=5,
        lat=19.0,
        lon=72.8,
    )
    assert 0 <= result["score"] <= 100
    assert result["historical"]["current_year"] == result["score"]

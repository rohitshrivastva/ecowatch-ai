"""Tests for Water Crisis Intelligence rule engine."""

from app.services.water_crisis import (
    STRESS_HIGH,
    STRESS_LOW,
    compute_water_crisis,
)


def _forecast_slots(pop: float):
    return {
        "timezone_offset": 0,
        "slots": [
            {"pop": pop, "temp": 22, "weather_main": "Clear", "description": "clear"}
            for _ in range(6)
        ],
    }


def _forecast_slots_trend(early_pop: float, late_pop: float):
    slots = []
    for i in range(6):
        pop = early_pop if i < 3 else late_pop
        slots.append(
            {"pop": pop, "temp": 22, "weather_main": "Clear", "description": "clear"}
        )
    return {"timezone_offset": 0, "slots": slots}


def _weather(humidity: int = 55, temperature: float = 22.0):
    return {"humidity": humidity, "temperature": temperature}


def _satellite(
    ndvi: float = 0.5,
    water_km: float = 10.0,
    green_pct: float = 40.0,
):
    return {
        "ndvi": ndvi,
        "ndvi_label": "Moderate Vegetation",
        "green_coverage_pct": green_pct,
        "water_proximity_km": water_km,
        "urban_heat_index": 1.0,
    }


def test_low_stress_stable_conditions():
    result = compute_water_crisis(
        _forecast_slots(0.35),
        _weather(humidity=55, temperature=22),
        _satellite(ndvi=0.5, water_km=8),
        lat=28.6,
        lon=77.2,
    )
    assert result["stress_level"] == STRESS_LOW
    assert result["drought_risk"] == "Low"
    assert len(result["indicators"]) == 4
    assert result["recommendations"]
    assert result["environmental_summary"]
    assert result["drought_forecast"]["outlook"] == "Stable"
    assert result["environmental_risk_score"] >= 0


def test_high_stress_dry_sparse_vegetation():
    result = compute_water_crisis(
        _forecast_slots(0.05),
        _weather(humidity=18, temperature=36),
        _satellite(ndvi=0.2, water_km=45, green_pct=15),
        lat=28.6,
        lon=77.2,
        risk={"score": 72},
    )
    assert result["stress_level"] in (STRESS_HIGH, "Critical")
    assert result["rainfall_deficit_pct"] is not None
    assert result["rainfall_deficit_pct"] > 0
    assert any("conservation" in r.lower() for r in result["recommendations"])
    assert len(result["climate_anomalies"]) >= 1
    assert result["degradation_signals"]
    assert result["global_stress_context"]


def test_drought_forecast_worsening():
    result = compute_water_crisis(
        _forecast_slots_trend(0.5, 0.1),
        _weather(),
        _satellite(),
        lat=20.0,
        lon=78.0,
    )
    assert result["drought_forecast"]["outlook"] == "Worsening"


def test_drought_forecast_improving():
    result = compute_water_crisis(
        _forecast_slots_trend(0.05, 0.55),
        _weather(),
        _satellite(),
        lat=20.0,
        lon=78.0,
    )
    assert result["drought_forecast"]["outlook"] == "Improving"

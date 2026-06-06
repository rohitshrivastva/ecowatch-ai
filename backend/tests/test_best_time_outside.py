"""Tests for Best Time Outside rule engine."""

import pytest

from app.services.best_time_outside import (
    STATUS_DANGEROUS,
    STATUS_EXCELLENT,
    compute_best_time_outside,
    rain_status_from_pop,
)


def _slot(
    hour_offset: int,
    pop: float,
    main: str = "Clear",
    desc: str = "clear sky",
    temp: float = 24.0,
):
    from datetime import datetime, timedelta, timezone

    ts = datetime.now(timezone.utc) + timedelta(hours=hour_offset)
    return {
        "timestamp": ts.isoformat(),
        "temp": temp,
        "feels_like": temp,
        "pop": pop,
        "weather_main": main,
        "description": desc,
        "wind_speed": 3.0,
        "rain_mm": pop * 5,
    }


def test_rain_status_thresholds():
    assert rain_status_from_pop(5, False) == STATUS_EXCELLENT
    assert rain_status_from_pop(15, False) == "Good"
    assert rain_status_from_pop(30, False) == "Moderate"
    assert rain_status_from_pop(60, False) == "Poor"
    assert rain_status_from_pop(80, True) == STATUS_DANGEROUS


def test_clear_conditions_excellent_window():
    forecast = {
        "timezone_offset": 0,
        "slots": [_slot(i * 3, 0.05, temp=22) for i in range(6)],
    }
    pollution = {"aqi": 40}
    weather = {"temperature": 22}
    result = compute_best_time_outside(forecast, pollution, weather)
    assert result["environmental_status"] in (STATUS_EXCELLENT, "Good")
    assert "–" in result["time_window"] or "After" in result["time_window"]
    assert len(result["suggestions"]) >= 1
    assert result["local_time"]
    assert result["timezone_label"]
    assert result["timezone_offset_seconds"] is not None
    assert "wind_speed" in result
    assert result["wind_speed"] is not None


def test_thunderstorm_dangerous():
    forecast = {
        "timezone_offset": 0,
        "slots": [
            _slot(0, 0.2),
            _slot(3, 0.9, main="Thunderstorm", desc="thunderstorm with rain"),
        ],
    }
    result = compute_best_time_outside(forecast, {"aqi": 50}, {"temperature": 25})
    assert result["thunderstorm_alert"] is True
    assert result["environmental_status"] == STATUS_DANGEROUS


def test_no_umbrella_when_dry_best_window():
    """Morning best window at 0% rain should not suggest umbrella."""
    forecast = {
        "timezone_offset": 19800,
        "slots": [
            _slot(0, 0.0, temp=22),
            _slot(3, 0.0, temp=24),
            _slot(6, 0.6, main="Rain", desc="light rain"),
        ],
    }
    result = compute_best_time_outside(forecast, {"aqi": 40}, {"temperature": 22})
    if result["rain_probability_pct"] == 0:
        assert result["show_umbrella"] is False


@pytest.mark.asyncio
async def test_analyze_includes_best_time_outside(client):
    response = await client.get("/api/v1/analyze", params={"lat": 28.61, "lon": 77.20})
    assert response.status_code == 200
    data = response.json()
    assert "best_time_outside" in data
    bto = data["best_time_outside"]
    assert bto["time_window"]
    assert bto["environmental_status"]
    assert bto["why"]
    assert isinstance(bto["suggestions"], list)
